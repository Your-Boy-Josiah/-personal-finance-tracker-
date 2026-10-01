// ===============================================================
//  categoryRoutes.js
//  Defines the API endpoints for transaction categories.
// ===============================================================

const express = require('express');
const router = express.Router();

const { getCategories, createCategory, deleteCategory, updateCategory } = 
require('../controllers/categoryController')

const { protect } = require('../middleware/authMiddleware');
const validate = require('../utils/validate');

// Use the destructured import since we now export two schemas
const { categorySchema, updateCategorySchema } = require('../validations/categorySchema');

// ==============================================================
// PRIVATE ROUTES
// ==============================================================

router.route('/')
  .get(protect, getCategories)
  .post(protect, validate(categorySchema), createCategory);

router.route('/:id')
  .put(protect, validate(updateCategorySchema), updateCategory)
  .delete(protect, deleteCategory);

module.exports = router;
