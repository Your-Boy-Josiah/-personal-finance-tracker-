// ===============================================================
//  alertRoutes.js
//  Routing for user alerts and notifications.
// ===============================================================

const express = require('express');
const router = express.Router();
const { getAlerts, markAlertAsRead } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

// ==============================================================
// ROUTES
// ==============================================================

router.route('/')
  .get(protect, getAlerts);

router.route('/:id/read')
  .put(protect, markAlertAsRead);

module.exports = router;
