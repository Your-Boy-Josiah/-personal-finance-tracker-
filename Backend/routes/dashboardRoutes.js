// ===============================================================
//  dashboardRoutes.js
//  Defines the API endpoints for dashboard analytics.
//  Applies security middleware to protect financial summaries.
// ===============================================================

const express = require('express');
const router = express.Router();

// Import controller function
const { getDashboardSummary } = require('../controllers/dashboardController');

// Import security middleware
const { protect } = require('../middleware/authMiddleware');

// ==============================================================
// PRIVATE ROUTES
// ==============================================================

// @route   GET /api/dashboard/summary
// @desc    Get aggregated financial totals
// @access  Private (Requires valid JWT)
router.route('/summary').get(protect, getDashboardSummary);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
