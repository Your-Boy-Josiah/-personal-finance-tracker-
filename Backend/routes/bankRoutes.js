const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  linkToken,
  exchangeToken,
  verifyWebhookSecret,
  webhook,
} = require("../controllers/bankController");

const router = express.Router();

router.post("/link-token", protect, linkToken);
router.post("/exchange-token", protect, exchangeToken);
router.post("/webhook", verifyWebhookSecret, webhook);

module.exports = router;
