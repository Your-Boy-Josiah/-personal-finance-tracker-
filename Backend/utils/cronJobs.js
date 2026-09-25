const cron = require("node-cron");
const Budget = require("../models/Budget");
const Category = require("../models/Category");
const Transaction = require("../models/Transaction");
const Alert = require("../models/Alert");

/**
 * Finds (or creates, once) the global default "Salary" income category
 * so auto-generated income transactions always have a valid category.
 */
async function getDefaultIncomeCategory() {
  return Category.findOneAndUpdate(
    { user: null, type: "income", name: "Salary" },
    { user: null, type: "income", name: "Salary" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

/**
 * D-2: Variable Schedule Income Processor
 * Runs daily; only acts on users whose schedule matches today.
 * - 'monthly' budgets: process on the 1st of the month
 * - 'weekly' budgets: process every Monday
 */
async function processIncomeSchedule() {
  const today = new Date();
  const isFirstOfMonth = today.getDate() === 1;
  const isMonday = today.getDay() === 1; // Sunday = 0, Monday = 1

  if (!isFirstOfMonth && !isMonday) {
    console.log("[cron] No income schedules due today.");
    return;
  }

  const defaultCategory = await getDefaultIncomeCategory();

  const budgets = await Budget.find({
    incomeFrequency: isFirstOfMonth ? "monthly" : "weekly",
  });

  for (const budget of budgets) {
    try {
      await Transaction.create({
        user: budget.user,
        type: "income",
        amount: budget.monthlyIncome,
        category: defaultCategory._id,
        description: `Auto-recorded ${budget.incomeFrequency} income`,
        transactionDate: today,
      });
      console.log(`[cron] Income recorded for user ${budget.user}`);
    } catch (err) {
      console.error(
        `[cron] Failed to record income for user ${budget.user}:`,
        err.message,
      );
    }
  }
}

/**
 * D-3: Proactive Spending Breach Detector
 * Runs daily. For each user's budget, checks actual spend this month
 * per category against categoryLimits. Creates an alert at 90% (warning)
 * and 100%+ (breach) — but only once per threshold per month, to avoid
 * spamming the same alert every day.
 */
async function detectSpendingBreaches() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const budgets = await Budget.find({ "categoryLimits.0": { $exists: true } });

  for (const budget of budgets) {
    for (const limit of budget.categoryLimits) {
      try {
        const spentResult = await Transaction.aggregate([
          {
            $match: {
              user: budget.user,
              category: limit.category,
              type: "expense",
              transactionDate: { $gte: startOfMonth, $lt: startOfNextMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        const totalSpent = spentResult[0]?.total || 0;
        if (limit.spendingCap <= 0) continue;

        const percentUsed = (totalSpent / limit.spendingCap) * 100;
        let alertType = null;

        if (percentUsed >= 100) alertType = "breach";
        else if (percentUsed >= 90) alertType = "warning";

        if (!alertType) continue;

        // Avoid duplicate alerts of the same type for this category this month
        const alreadyAlerted = await Alert.findOne({
          user: budget.user,
          category: limit.category,
          type: alertType,
          createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        });

        if (alreadyAlerted) continue;

        await Alert.create({
          user: budget.user,
          category: limit.category,
          type: alertType,
          percentUsed: Math.round(percentUsed),
          message:
            alertType === "breach"
              ? `You've exceeded your spending cap for this category (${Math.round(percentUsed)}% used).`
              : `You're approaching your spending cap for this category (${Math.round(percentUsed)}% used).`,
        });

        console.log(
          `[cron] ${alertType} alert created for user ${budget.user}`,
        );
      } catch (err) {
        console.error(
          `[cron] Breach check failed for user ${budget.user}:`,
          err.message,
        );
      }
    }
  }
}

/**
 * Central cron engine — all scheduled jobs are registered here.
 * Wrapped in try/catch so a single job failure never crashes the server.
 */
function startCronJobs() {
  // Runs once a day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[cron] Daily job triggered:", new Date().toISOString());
      await processIncomeSchedule();
      await detectedSpendingBreaches();
    } catch (err) {
      console.error("[cron] Daily job failed:", err.message);
    }
  });

  console.log("[cron] Cron engine initialized — jobs scheduled.");
}

module.exports = { startCronJobs };
