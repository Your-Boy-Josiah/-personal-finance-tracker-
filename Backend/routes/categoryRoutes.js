// ===============================================================
//  categoryRoutes.js
//  Defines the API endpoints for transaction categories.
//  Applies security middleware to ensure only authenticated
//  users can access or create categories.
// ===============================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const { getCategories, createCategory } = require('../controllers/categoryController');

// Import security middleware
const { protect } = require('../middleware/authMiddleware');
const validate = require('../utils/validate');
// Import Joi validation schema for category validation
const categorySchema = require('../validations/categorySchema');

// ==============================================================
// PRIVATE ROUTES
// ==============================================================

// @route   GET /api/categories
// @route   POST /api/categories
// @desc    Get user categories or create a new custom category
// @access  Private (Requires valid JWT)
router.route('/')
  .get(protect, getCategories)
  .post(protect, validate(categorySchema), createCategory); // Apply validation middleware to ensure request body adheres to categorySchema

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
