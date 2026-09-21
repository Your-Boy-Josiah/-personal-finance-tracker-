// ===============================================================
//  categoryController.js
//  Handles business logic for retrieving and creating transaction
//  categories. Ensures users only access their own categories.
// ===============================================================

const Category = require('../models/Category');

// ==============================================================
// CONTROLLER FUNCTIONS
// ==============================================================

// @desc    Get all categories for the logged-in user
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    // Fetch custom categories created by this user OR default global categories (where user is null)
    const categories = await Category.find({
      $or: [{ user: req.user._id }, { user: null }]
    });
    
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching categories', error: error.message });
  }
};

// @desc    Create a new custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const { name, type, color } = req.body;

    // 1. Validation check
    if (!name || !type) {
      return res.status(400).json({ message: 'Category name and type are required' });
    }

    // 2. Create the custom category linked to the specific user
    const category = await Category.create({
      name,
      type,
      color: color || '#000000', // Falls back to black if no color is provided
      user: req.user._id, // This comes directly from the protect authMiddleware
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating category', error: error.message });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  getCategories,
  createCategory,
};
