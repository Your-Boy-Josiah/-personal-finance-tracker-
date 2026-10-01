// ===============================================================
//  transactionController.js
//  Handles business logic for financial transactions, including
//  adding, retrieving, and securely deleting user records.
// ===============================================================

const Transaction = require('../models/Transaction');
const Category = require('../models/Category'); // ADDED: Needed for category validation
const { syncAndPersistTransactions } = require('../services/transactionServices');

// ==============================================================
// CONTROLLER FUNCTIONS
// ==============================================================

// @desc    Get all transactions for the logged-in user (Paginated & Filtered)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    // Extract query parameters with safe fallbacks (default: page 1, 10 items)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { type, category, startDate, endDate, search, month, timezone = 'UTC' } = req.query;
    
    // Calculate how many documents to skip based on the current page
    const skip = (page - 1) * limit;

    // FIXED: Build dynamic query object for filtering
    const query = { user: req.user._id };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate && endDate) {
      query.transactionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (month) {
      const monthMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
      if (!monthMatch) {
        return res.status(400).json({ success: false, message: 'month must use YYYY-MM format' });
      }

      try {
        new Intl.DateTimeFormat('en', { timeZone: timezone });
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid timezone' });
      }

      query.$expr = { $and: [
        { $eq: [
          { $month: { date: '$transactionDate', timezone } },
          Number(monthMatch[2])
        ] },
        { $eq: [
          { $year: { date: '$transactionDate', timezone } },
          Number(monthMatch[1])
        ] }
      ] };
    }
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Count total documents matching the filters for the frontend pagination UI
    const totalRecords = await Transaction.countDocuments(query);

    // Fetch only the requested chunk of filtered data
    const transactions = await Transaction.find(query)
      .populate('category', 'name color type') // Added populate so frontend gets category names
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit);
    
    // Return standardized response (Rule 11 compliance) with metadata
    res.status(200).json({
      success: true,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit
      },
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching transactions', 
      error: error.message 
    });
  }
};

// @desc    Add a new transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
  try {
    const { type, amount, category, subCategory, description, transactionDate } = req.body;

    // 1. Validation check
    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount, and category are required fields' });
    }

    // FIXED: Crucial Security Check - Ensure category belongs to user or is global
    const categoryExists = await Category.findOne({ 
      _id: category, 
      type,
      $or: [{ user: req.user._id }, { user: null }] 
    });

    if (!categoryExists) {
      return res.status(403).json({ message: 'Invalid or unauthorized category selection' });
    }

    // 2. Create the transaction linked securely to the logged-in user
    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
      subCategory: subCategory || null,
      description,
      transactionDate: transactionDate || Date.now(),
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding transaction', error: error.message });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    // 1. Find the transaction by ID
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // 2. Crucial Security Check: Ensure the user owns this transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this transaction' });
    }

    const nextCategoryId = req.body.category || transaction.category;
    const nextType = req.body.type || transaction.type;
    const updates = { ...req.body };

    if (req.body.category && req.body.subCategory === undefined) {
      updates.subCategory = null;
    }

    if (req.body.subCategory && !nextCategoryId) {
      return res.status(400).json({ message: 'A category is required for a sub-category' });
    }

    if (nextCategoryId && (req.body.category || req.body.type || req.body.subCategory !== undefined)) {
      const categoryExists = await Category.findOne({
        _id: nextCategoryId,
        type: nextType,
        $or: [{ user: req.user._id }, { user: null }] 
      });
      if (!categoryExists) {
        return res.status(403).json({ message: 'Invalid or unauthorized category selection' });
      }

    }

    // 3. Update the document in MongoDB
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating transaction', error: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    // 1. Find the specific transaction by the ID provided in the URL
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // 2. Crucial Security Check: Ensure the logged-in user actually owns this specific transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this transaction' });
    }

    // 3. Delete the authorized transaction
    await transaction.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting transaction', error: error.message });
  }
};

// @desc    Sync the user's bank transactions from Mono and upsert them
//          without creating duplicates
// @route   POST /api/transactions/sync
// @access  Private
const syncTransactions = async (req, res) => {
  try {
    const result = await syncAndPersistTransactions(req.user._id);

    res.status(200).json({
      message: 'Bank transactions synced successfully',
      ...result, // { matched, upserted, modified }
    });
  } catch (error) {
    const isClientError = /not connected|user not found/i.test(error.message);

    res.status(isClientError ? 400 : 500).json({
      message: isClientError ? error.message : 'Server error syncing bank transactions',
      error: error.message,
    });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  syncTransactions,
};
