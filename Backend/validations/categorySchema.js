// ===============================================================
//  categorySchema.js
//  Joi validation schemas for transaction categories.
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
  }),
  subCategories: Joi.array().items(Joi.string().trim()).optional().default([])
});

// Relaxed schema for partial updates
const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  type: Joi.string().valid('income', 'expense').optional(),
  color: Joi.string().pattern(/^#([0-9A-F]{3}){1,2}$/i).optional(),
  subCategories: Joi.array().items(Joi.string().trim()).optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided to update'
});

module.exports = {
  categorySchema,
  updateCategorySchema
};
