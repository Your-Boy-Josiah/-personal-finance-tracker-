// ===============================================================
//  advisoryService.js
//  Team C advisory engine. This service turns the user's current-month
//  expense history into practical guidance by classifying transactions,
//  aggregating totals, comparing category spending with budget caps, and
//  returning actionable advice. It never blocks or rewrites transactions.
// ===============================================================

const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// ============================================================== 
// KEYWORD GROUPS
// Category names and descriptions are used by the lightweight rule-based
// classifier. Unmatched expenses are kept in the miscellaneous group.
// ============================================================== 
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
  // ============================================================== 
  // classifyTransaction()
  // Labels an expense as essential, non-essential/cut-back, or
  // miscellaneous using its populated category name and description.
  // Uncategorized bank transactions safely fall back to miscellaneous.
  // ============================================================== 
  classifyTransaction(transaction) {
    const categoryName = transaction.category && transaction.category.name
      ? transaction.category.name
      : '';
    const text = `${categoryName} ${transaction.description || ''}`.toLowerCase();

    if (ESSENTIAL_KEYWORDS.some((keyword) => text.includes(keyword))) {
      return 'essential';
    }

    if (NON_ESSENTIAL_KEYWORDS.some((keyword) => text.includes(keyword))) {
      return 'non-essential/cut-back';
    }

    return 'miscellaneous';
  }

  // ============================================================== 
  // getAdvice()
  // 1. Load this month's expenses and the user's budget.
  // 2. Classify transactions and aggregate totals by category.
  // 3. Compare category totals with saved spending caps.
  // 4. Return classifications, overspend data, and recommendations.
  // ============================================================== 
  async getAdvice(userId) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [budget, transactions] = await Promise.all([
      Budget.findOne({ user: userId }).populate('categoryLimits.category', 'name type color'),
      Transaction.find({
        user: userId,
        type: 'expense',
        transactionDate: { $gte: monthStart, $lt: nextMonthStart },
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
    }, {
      essential: 0,
      miscellaneous: 0,
      'non-essential/cut-back': 0,
    });

    const categoryTotals = new Map();
    for (const transaction of classifiedTransactions) {
      const categoryId = transaction.category && transaction.category._id
        ? String(transaction.category._id)
        : 'uncategorized';
      const current = categoryTotals.get(categoryId) || {
        category: transaction.category,
        spent: 0,
      };
      current.spent += transaction.amount;
      categoryTotals.set(categoryId, current);
    }

    const overspentCategories = (budget ? budget.categoryLimits : []).reduce((overspent, limit) => {
      const categoryId = String(limit.category && limit.category._id
        ? limit.category._id
        : limit.category);
      const spent = categoryTotals.get(categoryId);
      const amountOver = spent ? spent.spent - limit.spendingCap : 0;

      if (amountOver > 0) {
        overspent.push({
          category: limit.category,
          spendingCap: limit.spendingCap,
          spent: spent.spent,
          amountOver,
        });
      }

      return overspent;
    }, []);

    const advice = overspentCategories.map((item) => ({
      category: item.category,
      message: `Spending is ${item.amountOver.toFixed(2)} over the cap. Review non-essential spending in this category and set a lower target for the rest of the month.`,
    }));

    if (classificationTotals['non-essential/cut-back'] > 0) {
      advice.push({
        category: null,
        message: `You spent ${classificationTotals['non-essential/cut-back'].toFixed(2)} on non-essential items this month. Consider redirecting part of this amount toward your savings goal.`,
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
