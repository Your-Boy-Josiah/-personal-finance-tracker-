// ===============================================================
//  budgetRoutes.js
//  Defines the protected budget and advisory endpoints.
// ===============================================================

const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../utils/validate');
const { updateBudgetSchema } = require('../validations/budgetSchema');
const { getBudget, updateBudget } = require('../controllers/budgetController');
const { getAdvisory } = require('../controllers/advisoryController');

const router = express.Router();

// ============================================================== 
// BUDGET ROUTES
// ============================================================== 
router.route('/')
  .get(protect, getBudget)
  .put(protect, validate(updateBudgetSchema), updateBudget); // FIX: Added Joi validation

// ============================================================== 
// ADVISORY ROUTE
// ============================================================== 
router.get('/advisory', protect, getAdvisory);

module.exports = router;
