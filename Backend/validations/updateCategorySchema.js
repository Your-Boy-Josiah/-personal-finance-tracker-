const Joi = require('joi');

module.exports = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  type: Joi.string().valid('income', 'expense'),
  color: Joi.string().pattern(/^#([0-9A-F]{3}){1,2}$/i),
  subCategories: Joi.array().items(Joi.string().trim()),
}).min(1);