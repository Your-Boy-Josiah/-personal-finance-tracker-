// ===============================================================
//  dashboardController.js
//  Handles business logic for the financial dashboard, using
//  MongoDB aggregation to calculate totals and balances efficiently.
// ===============================================================

const Transaction = require('../models/Transaction');

// ==============================================================
// CONTROLLER FUNCTIONS
// ==============================================================

// @desc    Get dashboard summary (income, expenses, balance)
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    // 1. Run the aggregation pipeline on the database level
    const summary = await Transaction.aggregate([
      {
        // Step A: Filter out everyone else's transactions
        $match: { user: req.user._id }
      },
      {
        // Step B: Group the remaining records by 'type' and calculate the sum
        $group: {
          _id: '$type', // Groups into 'income' and 'expense'
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // 2. Initialize default values in case the user has no transactions yet
    let totalIncome = 0;
    let totalExpenses = 0;

    // 3. Map the database results to our variables
    summary.forEach((item) => {
      if (item._id === 'income') {
        totalIncome = item.totalAmount;
      } else if (item._id === 'expense') {
        totalExpenses = item.totalAmount;
      }
    });

    // 4. Calculate the net balance
    const currentBalance = totalIncome - totalExpenses;

    // 5. Send the compiled financial snapshot to the frontend
    res.status(200).json({
      totalIncome,
      totalExpenses,
      currentBalance,
      currency: req.user.baseCurrency, // Automatically included from authMiddleware
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error generating dashboard summary', error: error.message });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  getDashboardSummary,
};
