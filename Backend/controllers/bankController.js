const crypto = require("crypto");
const User = require("../models/User");

const MONO_API_URL = process.env.MONO_API_URL || "https://api.withmono.com";

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

const encryptToken = (token) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted]
    .map((part) => part.toString("base64"))
    .join(".");
};

const monoRequest = async (path, options = {}) => {
  if (!process.env.MONO_SECRET_KEY) {
    throw new Error("MONO_SECRET_KEY is not configured");
  }

  const response = await fetch(`${MONO_API_URL}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "mono-sec-key": process.env.MONO_SECRET_KEY,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || "Mono request failed");
    error.statusCode = response.status;
    throw error;
  }
  return body;
};

const getProviderData = (body) => body.data || body;

const linkToken = async (req, res) => {
  try {
    const data = await monoRequest("/v2/accounts/initiate", {
      method: "POST",
      body: JSON.stringify({
        customer: {
          name: req.user.fullName,
          email: req.user.email,
        },
        meta: { userId: req.user._id.toString() },
        scope: "auth",
        ...(process.env.MONO_REDIRECT_URL
          ? { redirect_url: process.env.MONO_REDIRECT_URL }
          : {}),
      }),
    });

    return res.status(200).json({
      monoUrl: getProviderData(data).mono_url,
      customerId: getProviderData(data).customer,
    });
  } catch (error) {
    return res.status(error.statusCode || 502).json({ message: error.message });
  }
};

const exchangeToken = async (req, res) => {
  const publicToken = req.body.publicToken || req.body.code;
  if (!publicToken) {
    return res.status(400).json({ message: "publicToken is required" });
  }

  try {
    const response = await monoRequest("/account/auth", {
      method: "POST",
      body: JSON.stringify({ code: publicToken }),
    });
    const data = getProviderData(response);
    const accessToken = data.access_token || data.accessToken;

    if (!accessToken) {
      return res
        .status(502)
        .json({ message: "Mono did not return an access token" });
    }

    req.user.bankAccessToken = encryptToken(accessToken);
    req.user.bankConnected = true;
    if (data.customer || data.customer_id) {
      req.user.bankCustomerId = data.customer || data.customer_id;
    }
    await req.user.save();

    return res.status(200).json({ bankConnected: true });
  } catch (error) {
    return res.status(error.statusCode || 502).json({ message: error.message });
  }
};

const verifyWebhookSecret = (req, res, next) => {
  const configuredSecret = process.env.MONO_WEBHOOK_SECRET;
  const receivedSecret = req.get("mono-webhook-secret");
  const configuredBuffer = configuredSecret
    ? Buffer.from(configuredSecret)
    : null;
  const receivedBuffer = receivedSecret ? Buffer.from(receivedSecret) : null;
  const isValid =
    configuredBuffer &&
    receivedBuffer &&
    configuredBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, configuredBuffer);
  if (!isValid) {
    return res.status(401).json({ message: "Unauthorized request" });
  }
  return next();
};

const webhook = async (req, res) => {
  const event = req.body || {};
  const data = event.data || {};
  const customerId =
    data.customer || data.customer_id || data.account?.customer;

  try {
    if (customerId) {
      const user = await User.findOne({ bankCustomerId: customerId }).select(
        "+bankAccessToken",
      );
      if (
        user &&
        /deauthor|disconnect|revok/i.test(event.event || event.type || "")
      ) {
        user.bankAccessToken = undefined;
        user.bankConnected = false;
        await user.save();
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

module.exports = {
  linkToken,
  exchangeToken,
  verifyWebhookSecret,
  webhook,
};
