// ===============================================================
//  categoryController.js
//  Handles business logic for retrieving and creating transaction
//  categories. Ensures users only access their own categories.
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
    const categories = await Category.find({
      $or: [{ user: req.user._id }, { user: null }]
    });
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
      name, type, color: color || '#000000', user: req.user._id, 
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating category', error: error.message });
  }
};

// @desc    Delete a category and safely reassign its transactions
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const categoryId = req.params.id;
    const userId = req.user._id;

    const category = await Category.findById(categoryId).session(session);

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

    // Find or create "Uncategorized" bucket
    let uncategorized = await Category.findOne({ user: userId, name: 'Uncategorized' }).session(session);
    if (!uncategorized) {
      const uncats = await Category.create(
        [{ name: 'Uncategorized', type: category.type, color: '#999999', user: userId }], 
        { session }
      );
      uncategorized = uncats[0];
    }

    // Cascade reassign transactions
    await Transaction.updateMany(
      { category: categoryId, user: userId },
      { category: uncategorized._id },
      { session }
    );

    await Category.deleteOne({ _id: categoryId }, { session });

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ success: true, message: 'Category deleted and transactions safely reassigned' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: 'Server error during deletion cascade', error: error.message });
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