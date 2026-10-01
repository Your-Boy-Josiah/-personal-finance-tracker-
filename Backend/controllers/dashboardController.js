// ===============================================================
//  dashboardController.js
//  Handles business logic for the financial dashboard, using
//  MongoDB aggregation to calculate totals, balances, and trends.
// ===============================================================

const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget'); 

const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const userTz = req.query.timezone || 'UTC';

    // Get Totals (Income, Expenses, Balance)
    const totals = await Transaction.aggregate([
      { $match: { user: userId } },
      { $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{$eq: ["$type", "income"] }, "$amount", 0] } },
          totalExpenses: { $sum: { $cond: [{$eq: ["$type", "expense"] }, "$amount", 0] } }
        }
      }
    ]);

    const totalIncome = totals[0]?.totalIncome || 0;
    const totalExpenses = totals[0]?.totalExpenses || 0;
    const currentBalance = totalIncome - totalExpenses;

    // Fetch User's Total Budget Limit
    const userBudgets = await Budget.find({ user: userId });
    const totalBudgetLimit = userBudgets.reduce((sum, budget) => {
      const categoryLimits = budget.categoryLimits;
      
      // Removed dead branch. Direct sum of spendingCaps
      const categoryTotal = Array.isArray(categoryLimits)
        ? categoryLimits.reduce(
            (categorySum, category) => categorySum + Number(category.spendingCap ?? 0),
            0
          )
        : Number(categoryLimits?.spendingCap ?? 0);

      return sum + categoryTotal;
    }, 0);

    // Get Recent Transactions (Limit 5)
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(5)
      .populate('category', 'name color');

    // Category Spending (Drill-Down Setup: Group by category AND subCategory)
    const categorySpendingRaw = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense' } },
      { $group: { 
          _id: { category: "$category", subCategory: "$subCategory" }, 
          value: { $sum: "$amount" } 
        } 
      },
      { $group: {
          _id: "$_id.category",
          totalValue: { $sum: "$value" },
          subCategories: { 
            $push: { 
              name: { $ifNull: ["$_id.subCategory", "General"] },
              value: "$value" 
            } 
          }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    const populatedCategories = await Category.populate(categorySpendingRaw, { path: '_id', select: 'name color' });
    const categorySpending = populatedCategories.map(cat => ({
      id: cat._id?._id,
      name: cat._id?.name || 'Uncategorized',
      value: cat.totalValue,
      color: cat._id?.color || '#94a3b8',
      subCategories: cat.subCategories
    }));

    // Monthly Data 
    const monthlyDataRaw = await Transaction.aggregate([
      { $match: { user: userId } },
      { $group: {
          _id: { 
            month: { $month: { date: "$transactionDate", timezone: userTz } }, 
            year: { $year: { date: "$transactionDate", timezone: userTz } } 
          },
          income: { $sum: { $cond: [{$eq: ["$type", "income"] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{$eq: ["$type", "expense"] }, "$amount", 0] } }
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

    // Daily Trend Data (Last 30 Days) for Pop-Up Modals
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyDataRaw = await Transaction.aggregate([
      { $match: { 
          user: userId,
          transactionDate: { $gte: thirtyDaysAgo } 
        } 
      },
      { $group: {
          _id: { 
            day: { $dayOfMonth: { date: "$transactionDate", timezone: userTz } },
            month: { $month: { date: "$transactionDate", timezone: userTz } }, 
            year: { $year: { date: "$transactionDate", timezone: userTz } } 
          },
          income: { $sum: { $cond: [{$eq: ["$type", "income"] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{$eq: ["$type", "expense"] }, "$amount", 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    const dailyData = dailyDataRaw.map(data => ({
      date: `${monthNames[data._id.month - 1]} ${data._id.day}`,
      income: data.income,
      expenses: data.expenses,
      profit: data.income - data.expenses
    }));

    // Send Response
    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        totalBalance: currentBalance, 
        totalBudgetLimit, 
        recentTransactions,
        categorySpending,
        monthlyData,
        dailyData 
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error generating dashboard summary', error: error.message });
  }
};

module.exports = { 
  getDashboardSummary 
};
