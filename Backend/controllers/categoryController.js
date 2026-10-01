// ===============================================================
//  categoryController.js
//  Handles business logic for retrieving, creating, updating, and deleting
//  transaction categories. Unrestricted control for users.
// ===============================================================

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

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
    const { name, type, color, subCategories } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Category name and type are required' });
    }

    const category = await Category.create({
      name,
      type,
      color: color || '#000000',
      subCategories: Array.isArray(subCategories) ? subCategories : [],
      user: req.user._id, 
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating category', error: error.message });
  }
};

// @desc    Update a category (name, color, type, subCategories)
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const userId = req.user._id;

    let category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (!category.user || category.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this category' });
    }

    const { name, type, color, subCategories } = req.body;

    if (type && type !== category.type && (
      await Transaction.exists({ category: categoryId, type: { $ne: type } }) ||
      await Budget.exists({ 'categoryLimits.category': categoryId })
    )) {
      return res.status(400).json({ success: false, message: 'Category type cannot change while it has transactions of another type' });
    }
    
    if (name) category.name = name;
    if (type) category.type = type;
    if (color) category.color = color;
    
    // Explicitly update subCategories if an array is passed (even an empty one)
    if (Array.isArray(subCategories)) {
      category.subCategories = subCategories;
    }

    await category.save();

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating category', error: error.message });
  }
};

// @desc    Delete category and reassign transactions
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
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

    if (!category.user || category.user.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized to delete this category' });
    }

    let uncategorized = await Category.findOne({ 
      user: userId, 
      name: 'Uncategorized',
      type: category.type 
    }).session(session);

    if (!uncategorized) {
      const uncats = await Category.create(
        [{ name: 'Uncategorized', type: category.type, color: '#999999', user: userId }], 
        { session }
      );
      uncategorized = uncats[0];
    }

    await Transaction.updateMany(
      { category: categoryId, user: userId },
      { $set: { category: uncategorized._id, subCategory: null } },
      { session }
    );

    await Budget.updateMany(
      { user: userId },
      { $pull: { categoryLimits: { category: categoryId } } },
      { session }
    );

    await Category.deleteOne({ _id: categoryId }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      success: true, 
      message: 'Category deleted and transactions reassigned' 
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (next) next(error);
    else res.status(500).json({ success: false, message: 'Server error during deletion cascade', error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
