// ===============================================================
//  categoryRoutes.js
//  Defines the API endpoints for transaction categories.
// ===============================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const { getCategories, createCategory, deleteCategory, updateCategory } = 
require('../controllers/categoryController')

// Import security middleware
const { protect } = require('../middleware/authMiddleware');
const validate = require('../utils/validate');
// Import Joi validation schema for category validation
const categorySchema = require('../validations/categorySchema');
const updateCategorySchema = require('../validations/updateCategorySchema');

// ==============================================================
// PRIVATE ROUTES
// ==============================================================

// @route   GET /api/categories
// @route   POST /api/categories
// @route   PUT /api/categories/:id
// @route   DELETE /api/categories/:id
// @access  Private (Requires valid JWT)
router.route('/')
  .get(protect, getCategories)
  .post(protect, validate(categorySchema), createCategory);

// Mount the single ID route for deletion
router.route('/:id')
  .put(protect, validate(updateCategorySchema), updateCategory)
  .delete(protect, deleteCategory);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;