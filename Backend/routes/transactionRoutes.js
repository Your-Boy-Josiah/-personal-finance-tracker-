// ===============================================================
//  transactionRoutes.js
//  Defines the API endpoints for financial transactions.
//  Applies security middleware to ensure users can only access
//  and modify their own records.
// ===============================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

// Import security middleware
const { protect } = require('../middleware/authMiddleware');

const validate = require('../utils/validate');

const {createTransactionSchema, updateTransactionSchema} = require('../validations/transactionSchema')

// ==============================================================
// PRIVATE ROUTES
// ==============================================================

// @route   GET /api/transactions
// @route   POST /api/transactions
// @desc    Get all user transactions or add a new transaction
// @access  Private (Requires valid JWT)
router.route('/')
  .get(protect, getTransactions)
  .post(protect, validate(createTransactionSchema), addTransaction);

// @route   PUT /api/transactions/:id
// @route   DELETE /api/transactions/:id
// @desc    Update or delete a specific transaction
// @access  Private (Requires valid JWT)
router.route('/:id')
  .put(protect, validate(updateTransactionSchema), updateTransaction)
  .delete(protect, deleteTransaction);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
