// ===============================================================
//  budgetSchema.js
//  Joi validation schemas for user budgets.
// ===============================================================

const Joi = require('joi');

const categoryLimitSchema = Joi.object({
  category: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid category ID format'
  }),
  spendingCap: Joi.number().min(0).required()
});

const updateBudgetSchema = Joi.object({
  monthlyIncome: Joi.number().min(0).required(),
  incomeFrequency: Joi.string().valid('monthly', 'weekly').required(),
  currency: Joi.string().length(3).required(),
  categoryLimits: Joi.array().items(categoryLimitSchema).optional()
});

module.exports = { updateBudgetSchema };
