// ===============================================================
//  cronJobs.js
//  Automated background workers for variable income processing
//  and proactive spending breach detection (Tasks D-1, D-2, D-3).
// ===============================================================

const cron = require('node-cron');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const logger = require('./logger');

// ==============================================================
// VARIABLE SCHEDULE INCOME PROCESSOR
// ==============================================================
const processVariableIncome = async () => {
  const now = new Date();
  const isFirstOfMonth = now.getDate() === 1;
  const isMonday = now.getDay() === 1;

  if (!isFirstOfMonth && !isMonday) return;

  const budgets = await Budget.find({});
  
  for (const budget of budgets) {
    if ((budget.incomeFrequency === 'monthly' && isFirstOfMonth) || 
        (budget.incomeFrequency === 'weekly' && isMonday)) {
      
      await Transaction.create({
        user: budget.user,
        type: 'income',
        amount: budget.monthlyIncome, 
        description: 'Automated recurring income',
        transactionDate: now,
      });
      logger.info(`Automated income recorded for user ${budget.user}`);
    }
  }
};

// ==============================================================
// PROACTIVE SPENDING BREACH DETECTOR
// ==============================================================
const detectSpendingBreaches = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const budgets = await Budget.find({});

  for (const budget of budgets) {
    if (!budget.categoryLimits || budget.categoryLimits.length === 0) continue;

    for (const limit of budget.categoryLimits) {
      // Use MongoDB Aggregation to calculate total spent in this category this month
      const transactions = await Transaction.aggregate([
        {
          $match: {
            user: budget.user,
            category: limit.category,
            type: 'expense',
            transactionDate: { $gte: startOfMonth,$lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' }
          }
        }
      ]);

      const spent = transactions.length > 0 ? transactions[0].totalSpent : 0;
      const percentage = (spent / limit.spendingCap) * 100;

      if (percentage >= 90) {
        const alertType = percentage >= 100 ? 'critical' : 'warning';
        const message = percentage >= 100 
          ? `You have exceeded your cap of ${limit.spendingCap} for this category.`
          : `You are at ${percentage.toFixed(1)}% of your spending cap for this category.`;

        // Prevent spam: Check if an unread alert of this exact type already exists
        const existingAlert = await Alert.findOne({
          user: budget.user,
          category: limit.category,
          type: alertType,
          isRead: false
        });

        if (!existingAlert) {
          await Alert.create({
            user: budget.user,
            category: limit.category,
            type: alertType,
            message: message
          });
          logger.info(`Spending breach alert generated for user ${budget.user}`);
        }
      }
    }
  }
};

// ==============================================================
// CRON ENGINE INITIALIZATION
// ==============================================================
const initializeCronJobs = () => {
  // Runs every day at midnight (00:00) server time
  cron.schedule('0 0 * * *', async () => {
    logger.info('Starting daily background cron execution...');
    try {
      await processVariableIncome();
      await detectSpendingBreaches();
      logger.info('Daily cron jobs completed successfully.');
    } catch (error) {
      // Fails safely in the background, preventing main server crash
      logger.error('CRON ERROR: Failed to execute background tasks', error);
    }
  });
};

module.exports = initializeCronJobs;
