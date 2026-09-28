// ===============================================================
//  dashboardController.js
//  Handles business logic for the financial dashboard, using
//  MongoDB aggregation to calculate totals and balances efficiently.
// ===============================================================

const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget'); 

const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    // Extract timezone from client request, fallback to UTC
    const userTz = req.query.timezone || 'UTC';

    // Get Totals (Income, Expenses, Balance)
    const totals = await Transaction.aggregate([
      { $match: { user: userId } },
      { $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          totalExpenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
        }
      }
    ]);

    const totalIncome = totals[0]?.totalIncome || 0;
    const totalExpenses = totals[0]?.totalExpenses || 0;
    const currentBalance = totalIncome - totalExpenses;

    // Fetch User's Total Budget Limit
    const userBudgets = await Budget.find({ user: userId });

    // Adjust 'amount' to match your actual Budget schema field if it uses 'limit' instead
    const totalBudgetLimit = userBudgets.reduce((sum, budget) => sum + (budget.amount || budget.limit || 0), 0);

    // Get Recent Transactions (Limit 5)
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('category', 'name color');

    // Category Spending (Group by category, sum expenses)
    const categorySpendingRaw = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense' } },
      { $group: { _id: "$category", value: { $sum: "$amount" } } },
      { $sort: { value: -1 } }
    ]);

    const populatedCategories = await Category.populate(categorySpendingRaw, { path: '_id', select: 'name color' });
    const categorySpending = populatedCategories.map(cat => ({
      name: cat._id?.name || 'Uncategorized',
      value: cat.value,
      color: cat._id?.color || '#94a3b8'
    }));

    // Monthly Data (Using Client Timezone for precise grouping)
    const monthlyDataRaw = await Transaction.aggregate([
      { $match: { user: userId } },
      { $group: {
          _id: { 
            month: { $month: { date: "$createdAt", timezone: userTz } }, 
            year: { $year: { date: "$createdAt", timezone: userTz } } 
          },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = monthlyDataRaw.map(data => ({
      month: monthNames[data._id.month - 1],
      income: data.income,
      expenses: data.expenses
    }));

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        totalBalance: currentBalance,
        totalBudgetLimit, // Sent dynamically to the frontend
        recentTransactions,
        categorySpending,
        monthlyData
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error generating dashboard summary', error: error.message });
  }
};

module.exports = { 
  getDashboardSummary 
};