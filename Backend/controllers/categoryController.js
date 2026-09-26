// ===============================================================
//  categoryController.js
//  Handles business logic for retrieving, creating, and deleting
//  transaction categories. Ensures users only access their own categories.
// ===============================================================

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

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
    
    // Fixed: Standardized response shape
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching categories', error: error.message });
  }
};

// @desc    Create a new custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const { name, type, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Category name and type are required' });
    }

    const category = await Category.create({
      name,
      type,
      color: color || '#000000',
      user: req.user._id, 
    });

    // Fixed: Standardized response shape
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating category', error: error.message });
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
    const userId = req.user._id;

    // 1. Find the category and bind it to the session
    const category = await Category.findById(categoryId).session(session);
    
    // 2. Strict Validation Checks
    if (!category) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category.user === null) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Cannot delete global system categories' });
    }

    if (category.user.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ success: false, message: 'Not authorized to delete this category' });
    }

    // 3. Fixed: Find or create an "Uncategorized" bucket to prevent frontend crashes
    let uncategorized = await Category.findOne({ user: userId, name: 'Uncategorized' }).session(session);
    if (!uncategorized) {
      const uncats = await Category.create(
        [{ name: 'Uncategorized', type: category.type, color: '#999999', user: userId }], 
        { session }
      );
      uncategorized = uncats[0];
    }

    // 4. Safely reassign orphaned transactions to the Uncategorized bucket
    await Transaction.updateMany(
      { category: categoryId, user: userId },
      { $set: { category: uncategorized._id } },
      { session }
    );

    // 5. Delete the original category
    await Category.deleteOne({ _id: categoryId }).session(session);

    // 6. Commit the ACID transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      success: true, 
      message: 'Category deleted and transactions successfully reassigned to Uncategorized' 
    });

  } catch (error) {
    // If anything fails, rollback all database changes
    await session.abortTransaction();
    session.endSession();
    
    if (next) {
      next(error);
    } else {
      res.status(500).json({ success: false, message: 'Server error during deletion cascade', error: error.message });
    }
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
