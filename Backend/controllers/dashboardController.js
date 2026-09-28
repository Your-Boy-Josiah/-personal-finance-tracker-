// ===============================================================
//  dashboardController.js
//  Handles business logic for the financial dashboard, using
//  MongoDB aggregation to calculate totals and balances efficiently.
// ===============================================================

const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

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

    // Monthly Data (Group by month and year)
    const monthlyDataRaw = await Transaction.aggregate([
      { $match: { user: userId } },
      { $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
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

    // Send everything to the frontend
    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        totalBalance: currentBalance,
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
