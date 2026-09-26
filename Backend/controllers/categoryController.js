// ===============================================================
//  categoryController.js
//  Handles business logic for retrieving, creating, and deleting
//  transaction categories. Ensures users only access their own categories.
// ===============================================================

const Category = require('../models/Category');
const Transaction = require('../models/Transaction'); // Required for ACID cascade
const mongoose = require('mongoose'); // Required for database sessions

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

// @desc    Delete category and reassign transactions (ACID Cascade)
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const categoryId = req.params.id;

    // 1. Ensure the category exists and belongs to the active user
    const category = await Category.findOne({ _id: categoryId, user: req.user._id });
    
    if (!category) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
    }

    // 2. Delete the category securely within the session
    await Category.deleteOne({ _id: categoryId }).session(session);

    // 3. Reassign orphaned transactions to 'Uncategorized' (null)
    await Transaction.updateMany(
      { category: categoryId, user: req.user._id },
      { $set: { category: null } }
    ).session(session);

    // 4. Commit the ACID transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      success: true, 
      message: 'Category deleted and transactions successfully reassigned' 
    });

  } catch (error) {
    // If anything fails, rollback all database changes
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  getCategories,
  createCategory,
  deleteCategory
};
