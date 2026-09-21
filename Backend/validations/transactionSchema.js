// ===============================================================
//  transactionSchema.js
//  Joi validation schemas for financial transactions.
//  Ensures amounts are positive and object references are valid.
// ===============================================================

const Joi = require('joi');

const createTransactionSchema = Joi.object({
  amount: Joi.number().greater(0).required().messages({
    'number.greater': 'Transaction amount must be greater than zero',
    'any.required': 'Transaction amount is required'
  }),
  category: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid category ID format'
  }),
  type: Joi.string().valid('income', 'expense').required(),
  transactionDate: Joi.date().iso().optional(), // Optional because Mongoose defaults to Date.now
  description: Joi.string().trim().max(255).optional().allow('')
  // NOTE: 'user' is intentionally excluded here.
});

const updateTransactionSchema = Joi.object({
  amount: Joi.number().greater(0).optional(),
  category: Joi.string().hex().length(24).optional(),
  type: Joi.string().valid('income', 'expense').optional(),
  transactionDate: Joi.date().iso().optional(),
  description: Joi.string().trim().max(255).optional().allow('')
});

// ============================================================
// EXPORT SCHEMAS
// ============================================================
module.exports = {
  createTransactionSchema,
  updateTransactionSchema
};
