### Personal-Finance-Tracker
Capstone Project for TS Academy 

## Initial Backend Setup & Architecture
* **Directory Scaffolding:** Configured modular backend hierarchy
 (`config`, `controllers`, `middleware`, `models`, `routes`, `services`, `tests`, `utils`).

* **Environment Setup:** Initialized Node runtime configuration (`package.json`), environment variables template (`.env`), and repository hygiene rules (`.gitignore`).

* **Mongoose Models:**
  * `User.js`: Schema with authentication lookups, soft-delete flag, and virtual `fullName`.
  * `Transaction.js`: Financial entry tracking with user references, indexing for queries/reports, and dynamic `formattedAmount` virtual.
  * Applied uniform JSDoc/block comment architecture across models.

## What is in the NEW COMMIT
# A more complete Backend Architecture

## Core API, Security, & Features (Recent Updates)
* **Authentication & Security:** 
  * Implemented JWT (JSON Web Token) generation and verification.
  * Integrated `bcryptjs` for secure password hashing during user registration.
  * Built public `register` and `login` endpoints in `authController.js`.

* **Custom Middleware:**
  * `authMiddleware.js`: Protects private routes by extracting/verifying Bearer tokens, mapping the active user, and immediately blocking requests from soft-deleted accounts.
  * `errorMiddleware.js`: Overrides default Express HTML errors with structured JSON responses, safely hiding stack traces in production.

* **Schema Enhancements:**
  * Upgraded `User.js` with production-ready fields including `role` (user/admin), `baseCurrency` preference, and account recovery infrastructure.
  * Created `Category.js`: Supports both global default categories (user: null) and custom user-specific categories.
  * Refactored `Transaction.js`: Converted the `category` field from a String to a relational `ObjectId`, linking directly to the Category model to unlock Mongoose `.populate()`.

* **RESTful Controllers & Routes:**
  * Completed fully protected CRUD operations for Categories (`categoryController.js`).
  * Completed fully protected CRUD operations for Transactions (`transactionController.js`).
  * Mounted all endpoint groups cleanly inside `app.js`.

* **Dashboard & Analytics:**
  * Created `dashboardController.js` utilizing **MongoDB Aggregation Pipelines**.
  * Offloads heavy math to the database to calculate total income, total expenses, and net balance efficiently, ensuring server stability as transaction volumes grow.


**Owner:** Teammate B
**Status:** Implemented, not yet tested

This document covers the work done for tasks **B-1, B-2, and B-3**, and how they fit into the rest of the app.

---

## Summary

Three pieces work together to pull bank transactions in from Mono and store them without creating duplicates:

| Task | What it does | File |
|------|--------------|------|
| B-1 | Extends the `Transaction` schema to hold bank-sourced data, with a unique index to prevent duplicates | `models/Transaction.js` |
| B-2 | Fetches and normalizes a user's transactions from Mono | `services/transactionServices.js` |
| B-3 | Persists normalized transactions via bulk upsert (idempotent) | `services/transactionServices.js` |

A new route (`POST /api/transactions/sync`) and controller function wire these into the API.

---

## B-1: Transaction Schema Extension

Added four new fields to `Transaction.js`, alongside the existing `type`, `amount`, `category`, `description`, `transactionDate`:

- `bankTransactionId` (String, sparse index) — unique ID from the bank, used for dedup
- `bankName` (String)
- `merchant` (String)
- `rawDescription` (String) — the unprocessed description as returned by Mono, kept separate from the existing `description` field, which is user-editable

**Compound index:**
```js
{ user: 1, bankTransactionId: 1 } // unique, partial (only applies when bankTransactionId exists)
```

This is what actually enforces "no duplicate bank transaction per user" at the database level. Manually added transactions (no `bankTransactionId`) are unaffected.

---

## B-2: Sync Bank Transactions Service

`syncBankTransactions(userId)` in `services/transactionServices.js`:

1. Looks up the user, requires `bankConnected: true` and a stored `bankAccessToken`
2. Decrypts the token — **matches Teammate A's `encryptToken` format exactly**: AES-256-GCM, stored as `iv.authTag.ciphertext` (base64, dot-joined)
3. Calls Mono's transactions endpoint with the decrypted token
4. Normalizes each raw transaction into our schema shape (`bankTransactionId`, `bankName`, `merchant`, `rawDescription`, `amount`, `type`, `transactionDate`)
5. Returns the normalized array — **does not write to the database**

### ⚠️ Open assumptions (need verification against a real Mono sandbox response)

- **Endpoint path** — currently `/accounts/{id}/transactions`, using `user.bankAccountId || user.bankCustomerId`. Teammate A's `exchangeToken` only stores `bankCustomerId`, not an account ID. **Need to confirm with Teammate A or Mono's docs whether an account ID is available/required.**
- **Amount format** — assumed kobo (divided by 100 to get naira). Unconfirmed.
- **Type mapping** — assumed Mono returns `type: "debit" | "credit"`. Unconfirmed.
- **`category` field** — intentionally left unset on sync, since Mono has no concept of our Category model. **Needs a team decision**: default/fallback category, or leave uncategorized until Track C's advisory engine tags it?

### Code duplication note

`encryptToken`/decryption logic and the Mono request helper currently exist in **both** `bankController.js` (Teammate A) and `transactionServices.js` (this work). Recommend extracting to a shared `utils/encryption.js` and `utils/monoClient.js` so the two don't drift out of sync if either changes.

---

## B-3: Idempotent Bulk Upsert Engine

`upsertBankTransactions(normalizedTransactions)` in `services/transactionServices.js`:

- Uses `Transaction.bulkWrite()` with `updateOne` + `upsert: true`
- Match key: `{ user, bankTransactionId }` — relies on B-1's unique partial index
- Repeated syncs update existing records in place rather than duplicating them

**Design decision:** `category` is excluded from the `$set` on updates. If a user manually re-categorizes a bank transaction, a later sync will **not** overwrite that choice. Only bank-sourced fields (`amount`, `merchant`, `rawDescription`, `bankName`, `transactionDate`, `type`) get refreshed.

Also added `syncAndPersistTransactions(userId)` — a convenience wrapper that chains B-2 → B-3 in one call. This is the function the API route calls.

---

## API Wiring

**New route:** `POST /api/transactions/sync` (protected, requires JWT)

- `routes/transactionRoutes.js` — added `router.route('/sync').post(protect, syncTransactions)`
- `controllers/transactionController.js` — added `syncTransactions`, which calls `syncAndPersistTransactions(req.user._id)` and returns `{ message, matched, upserted, modified }`

Error handling matches the existing controller style (inline try/catch, not the global `errorHandler`). "User not connected" / "user not found" return `400`; anything else returns `500`.

---

## What's NOT done yet

- [ ] **Not tested** — no manual or automated tests run yet against real or mocked data
- [ ] Mono endpoint/amount/type assumptions above need confirming against a real sandbox call
- [ ] `category` assignment strategy for synced transactions needs a team decision
- [ ] Shared `utils/` extraction for encryption + Mono request logic (currently duplicated with Teammate A's code)
- [ ] PR not yet opened for Teammate G's review

---

## Files changed

- `models/Transaction.js` — B-1
- `services/transactionServices.js` — B-2 + B-3 (new file)
- `controllers/transactionController.js` — added `syncTransactions`
- `routes/transactionRoutes.js` — added `/sync` route
