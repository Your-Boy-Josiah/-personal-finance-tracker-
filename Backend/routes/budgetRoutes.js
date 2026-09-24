// ===============================================================
//  budgetRoutes.js
//  Defines the protected budget and advisory endpoints. The
//  router is mounted in app.js as /api/budget so only authenticated
//  users can access their own budget data and advice.
// ===============================================================

const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getBudget, updateBudget } = require('../controllers/budgetController');
const { getAdvisory } = require('../controllers/advisoryController');

const router = express.Router();

// ============================================================== 
// BUDGET ROUTES
// GET reads the current planning document. PUT creates it if absent or
// updates it if present, keeping one budget per authenticated user.
// ============================================================== 
router.route('/').get(protect, getBudget).put(protect, updateBudget);

// ============================================================== 
// ADVISORY ROUTE
// Advice is separate from CRUD so clients can request fresh calculations
// without changing the saved budget configuration.
// ============================================================== 
router.get('/advisory', protect, getAdvisory);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
