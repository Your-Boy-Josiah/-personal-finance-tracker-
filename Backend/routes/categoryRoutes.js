// ===============================================================
//  categoryRoutes.js
//  Defines the API endpoints for transaction categories.
//  Applies security middleware to ensure only authenticated
//  users can access or create categories.
// ===============================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController')

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
// @route   DELETE /api/categories/:id
// @access  Private (Requires valid JWT)
router.route('/')
  .get(protect, getCategories)
  .post(protect, validate(categorySchema), createCategory);

// Mount the single ID route for deletion
router.route('/:id')
  .delete(protect, deleteCategory);
  
// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
