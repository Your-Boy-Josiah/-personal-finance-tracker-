// ===============================================================
//  categorySchema.js
//  Joi validation schemas for transaction categories.
//  Ensures category names, types, and hex colors are valid.
// ===============================================================

const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Category name is required'
  }),
  type: Joi.string().valid('income', 'expense').required().messages({
    'any.only': 'Category type must be either income or expense'
  }),
  color: Joi.string().pattern(/^#([0-9A-F]{3}){1,2}$/i).optional().messages({
    'string.pattern.base': 'Color must be a valid hex code (e.g., #FF5733)'
  })
  // NOTE: 'user' is intentionally excluded here. 
  // It will be attached by the authMiddleware, not the request body.
});

// ============================================================
// EXPORT SCHEMAS
// ============================================================
module.exports = categorySchema;
