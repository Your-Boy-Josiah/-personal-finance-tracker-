// ===============================================================
//  advisoryService.js
//  Advisory engine. Turns expense history into practical guidance.
//  Upgraded to provide positive reinforcement and flag uncategorized data.
// ===============================================================

const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const ESSENTIAL_KEYWORDS = [
  'rent', 'housing', 'mortgage', 'utility', 'utilities', 'electricity',
  'water', 'food', 'groceries', 'health', 'medical', 'medicine',
  'transport', 'transportation', 'fuel', 'education', 'insurance',
];

const NON_ESSENTIAL_KEYWORDS = [
  'dining', 'restaurant', 'takeout', 'entertainment', 'movie', 'shopping',
  'clothing', 'subscription', 'vacation', 'travel', 'gaming', 'alcohol',
];

class AdvisoryService {
  classifyTransaction(transaction) {
    const categoryName = transaction.category && transaction.category.name ? transaction.category.name : '';
    const text = `${categoryName} ${transaction.description || ''}`.toLowerCase();

    if (ESSENTIAL_KEYWORDS.some((keyword) => text.includes(keyword))) return 'essential';
    if (NON_ESSENTIAL_KEYWORDS.some((keyword) => text.includes(keyword))) return 'non-essential/cut-back';
    return 'miscellaneous';
  }

  async getAdvice(userId) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [budget, transactions] = await Promise.all([
      Budget.findOne({ user: userId }).populate('categoryLimits.category', 'name type color'),
      Transaction.find({
        user: userId,
        type: 'expense',
        transactionDate: { $gte: monthStart,$lt: nextMonthStart },
      }).populate('category', 'name type color'),
    ]);

    const classifiedTransactions = transactions.map((transaction) => ({
      transactionId: transaction._id,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      transactionDate: transaction.transactionDate,
      classification: this.classifyTransaction(transaction),
    }));

    const classificationTotals = classifiedTransactions.reduce((totals, transaction) => {
      totals[transaction.classification] += transaction.amount;
      return totals;
    }, { essential: 0, miscellaneous: 0, 'non-essential/cut-back': 0 });

    const categoryTotals = new Map();
    for (const transaction of classifiedTransactions) {
      const categoryId = transaction.category && transaction.category._id ? String(transaction.category._id) : 'uncategorized';
      const current = categoryTotals.get(categoryId) || { category: transaction.category, spent: 0 };
      current.spent += transaction.amount;
      categoryTotals.set(categoryId, current);
    }

    const advice = [];

    // FIX 1: Explicitly warn the user about uncategorized bank transactions
    const uncategorizedCount = classifiedTransactions.filter(t => !t.category).length;
    if (uncategorizedCount > 0) {
      advice.push({
        category: null,
        status: 'warning',
        message: `You have ${uncategorizedCount} uncategorized transaction(s). Categorize them so they count toward your budget limits!`
      });
    }

    // FIX 2: Evaluate spending vs caps (including positive reinforcement)
    const overspentCategories = [];
    (budget ? budget.categoryLimits : []).forEach(limit => {
      const categoryId = String(limit.category && limit.category._id ? limit.category._id : limit.category);
      const spentObj = categoryTotals.get(categoryId);
      const spent = spentObj ? spentObj.spent : 0;
      const difference = spent - limit.spendingCap;

      if (difference > 0) {
        overspentCategories.push({ category: limit.category, spendingCap: limit.spendingCap, spent, amountOver: difference });
        advice.push({
          category: limit.category,
          status: 'over_budget',
          message: `Spending is ${difference.toFixed(2)} over the cap. Review non-essential spending here.`
        });
      } else if (difference < 0) {
        advice.push({
          category: limit.category,
          status: 'under_budget',
          message: `Great job! You are ${Math.abs(difference).toFixed(2)} under your cap for this category.`
        });
      } else {
        advice.push({
          category: limit.category,
          status: 'on_budget',
          message: `You have exactly hit your spending cap for this category.`
        });
      }
    });

    if (classificationTotals['non-essential/cut-back'] > 0) {
      advice.push({
        category: null,
        status: 'info',
        message: `You spent ${classificationTotals['non-essential/cut-back'].toFixed(2)} on non-essential items this month. Consider redirecting part of this toward savings.`,
      });
    }

    return {
      period: { start: monthStart, end: nextMonthStart },
      classificationTotals,
      categoryTotals: Array.from(categoryTotals.values()),
      overspentCategories,
      advice,
      transactions: classifiedTransactions,
    };
  }
}

module.exports = AdvisoryService;
