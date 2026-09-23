// ===============================================================
//  bankRoutes.js
//  Defines API endpoints for banking interactions and webhooks.
// ===============================================================

const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  linkToken,
  exchangeToken,
  verifyWebhookSecret,
  webhook,
} = require("../controllers/bankController");

const router = express.Router();

// ==============================================================
// PROTECTED ROUTES (Requires User JWT)
// ==============================================================

// Used to open the frontend Mono widget
router.post("/link-token", protect, linkToken);

// Used to finalize the connection and save the encrypted token
router.post("/exchange-token", protect, exchangeToken);

// ==============================================================
// PUBLIC ROUTES (Secured via Signature Verification)
// ==============================================================

// Listens for automated server-to-server updates from Mono
router.post("/webhook", verifyWebhookSecret, webhook);

module.exports = router;
