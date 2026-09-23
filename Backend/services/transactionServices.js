// ===============================================================
//  transactionServices.js
//  Service layer for syncing bank transactions from Mono into the
//  local Transaction collection.
// ===============================================================

const crypto = require("crypto");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const MONO_API_URL = process.env.MONO_API_URL || "https://api.withmono.com";

// ============================================================
// TOKEN DECRYPTION
// Mirrors encryptToken() in controllers/bankController.js exactly.
// Stored format: "<iv>.<authTag>.<ciphertext>", each base64-encoded.
// NOTE: this duplicates logic from bankController.js. Recommend
// Teammate A and I move encryptToken/decryptToken into a shared
// utils/encryption.js so both files stay in sync.
// ============================================================

const getEncryptionKey = () => {
  const encodedKey = process.env.BANK_TOKEN_ENCRYPTION_KEY;
  if (!encodedKey) {
    throw new Error("BANK_TOKEN_ENCRYPTION_KEY is not configured");
  }

  const key = /^[0-9a-f]{64}$/i.test(encodedKey)
    ? Buffer.from(encodedKey, "hex")
    : Buffer.from(encodedKey, "base64");

  if (key.length !== 32) {
    throw new Error("BANK_TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return key;
};

const decryptToken = (stored) => {
  const [ivB64, authTagB64, encryptedB64] = stored.split(".");
  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("Stored bank token is malformed");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
};

// ============================================================
// MONO API REQUEST HELPER
// ============================================================

const monoRequest = async (path, accessToken, options = {}) => {
  const response = await fetch(`${MONO_API_URL}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "mono-sec-key": process.env.MONO_SECRET_KEY,
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || "Mono transaction fetch failed");
    error.statusCode = response.status;
    throw error;
  }
  return body;
};

// ============================================================
// NORMALIZATION
// Maps a raw Mono transaction object to our Transaction schema shape.
// ASSUMPTION (please confirm against a real Mono sandbox response):
// Mono returns `type: "debit" | "credit"` and `amount` in kobo (minor units).
// Adjust the divisor / type mapping once we see a live payload.
// ============================================================

const normalizeMonoTransaction = (raw) => ({
  bankTransactionId: raw._id || raw.id,
  bankName: raw.institution || raw.bank || "Mono",
  merchant: raw.narration || raw.merchant || null,
  rawDescription: raw.narration || raw.description || "",
  amount: Math.abs(raw.amount) / 100, // kobo -> naira; confirm with sandbox data
  type: raw.type === "credit" ? "income" : "expense",
  transactionDate: raw.date ? new Date(raw.date) : new Date(),
  // category is intentionally left unset here — B-3 / a later categorization
  // step should assign it, since Mono has no concept of our Category model.
});

// ============================================================
// MAIN SYNC FUNCTION
// ============================================================

/**
 * Fetches and normalizes a user's bank transactions from Mono.
 * Does NOT write to the database — B-3's bulk upsert engine consumes
 * this function's output and handles persistence.
 *
 * @param {string} userId
 * @returns {Promise<Array<Object>>} normalized transactions, not yet saved
 */
const syncBankTransactions = async (userId) => {
  const user = await User.findById(userId).select("+bankAccessToken");

  if (!user) {
    throw new Error("User not found");
  }
  if (!user.bankConnected || !user.bankAccessToken) {
    throw new Error("User has not connected a bank account");
  }

  const accessToken = decryptToken(user.bankAccessToken);

  // ASSUMPTION: Mono's transaction list endpoint. Confirm exact path/params
  // (pagination, account id vs customer id) against Teammate A's sandbox setup.
  const response = await monoRequest(
    `/accounts/${user.bankAccountId || user.bankCustomerId}/transactions`,
    accessToken,
  );

  const rawTransactions = response.data || response.transactions || [];

  return rawTransactions.map((raw) => ({
    user: user._id,
    ...normalizeMonoTransaction(raw),
  }));
};

// ============================================================
// IDEMPOTENT BULK UPSERT ENGINE (Task B-3)
// Persists normalized transactions using bulkWrite + upsert, keyed
// on bankTransactionId. Relies on the { user: 1, bankTransactionId: 1 }
// unique partial index from B-1 as the source of truth — the upsert
// filter below is what makes repeated sync calls idempotent.
// ============================================================

/**
 * Bulk-upserts an array of normalized bank transactions.
 *
 * @param {Array<Object>} normalizedTransactions - output of syncBankTransactions()
 * @returns {Promise<Object>} summary of the bulk write result
 */
const upsertBankTransactions = async (normalizedTransactions) => {
  if (!Array.isArray(normalizedTransactions) || normalizedTransactions.length === 0) {
    return { matched: 0, upserted: 0, modified: 0 };
  }

  const operations = normalizedTransactions.map((tx) => {
    if (!tx.bankTransactionId) {
      throw new Error("Cannot upsert a transaction without bankTransactionId");
    }
    if (!tx.user) {
      throw new Error("Cannot upsert a transaction without a user reference");
    }

    // Only fields that can legitimately change on a re-sync are updated.
    // user/bankTransactionId are the match keys and never change.
    // category is deliberately excluded — if a user re-categorizes a
    // transaction manually, a later sync should NOT silently overwrite it.
    const { user, bankTransactionId, ...updatableFields } = tx;

    return {
      updateOne: {
        filter: { user, bankTransactionId },
        update: {
          $set: updatableFields,
          $setOnInsert: { user, bankTransactionId },
        },
        upsert: true,
      },
    };
  });

  const result = await Transaction.bulkWrite(operations, { ordered: false });

  return {
    matched: result.matchedCount,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
  };
};

/**
 * Convenience wrapper: syncs a user's bank transactions and immediately
 * persists them via the idempotent bulk upsert. This is the function
 * your controller route (e.g. POST /api/transactions/sync) should call.
 *
 * @param {string} userId
 * @returns {Promise<Object>} bulk write summary
 */
const syncAndPersistTransactions = async (userId) => {
  const normalizedTransactions = await syncBankTransactions(userId);
  return upsertBankTransactions(normalizedTransactions);
};

module.exports = {
  syncBankTransactions,
  upsertBankTransactions,
  syncAndPersistTransactions,
  decryptToken, // exported for reuse / tests
  normalizeMonoTransaction,
};
