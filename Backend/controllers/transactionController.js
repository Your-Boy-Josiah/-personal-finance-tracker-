// ===============================================================
//  transactionController.js
//  Handles business logic for financial transactions, including
//  adding, retrieving, and securely deleting user records.
// ===============================================================

const Transaction = require('../models/Transaction');
const { syncAndPersistTransactions } = require('../services/transactionServices');

// ==============================================================
// CONTROLLER FUNCTIONS
// ==============================================================

// @desc    Get all transactions for the logged-in user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    // Fetch transactions strictly for the authenticated user, sorted by newest first
    const transactions = await Transaction.find({ user: req.user._id }).sort({ transactionDate: -1 });
    
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching transactions', error: error.message });
  }
};

// @desc    Add a new transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
  try {
    const { type, amount, category, description, transactionDate } = req.body;

    // 1. Validation check
    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount, and category are required fields' });
    }

    // 2. Create the transaction linked securely to the logged-in user
    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
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

    // 3. Update the document in MongoDB
    // { new: true } returns the updated document rather than the old one
    // { runValidators: true } ensures they can't change the amount to a negative number, etc.
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
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
    // "User has not connected a bank account" / "User not found" are
    // client-side problems (400), not server errors (500).
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
