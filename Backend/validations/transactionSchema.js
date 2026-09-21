const joi = require('joi');

// Define the schema for category validation. With this we determine what to expect from the input data and how to validate it. This ensures that the data is in the correct format before it is processed or stored in the database.
const createTransactionSchema = joi.object({
  amount: joi.number().required().min(0), // Amount must be a non-negative number
  category: joi.string().hex().length(24).required(), // Assuming category ID is a MongoDB ObjectId
  transactionDate: joi.date().iso().required(),
  type: joi.string().valid('income', 'expense').required(), // Date must be in ISO format
  description: joi.string().max(255).optional(), // Description is optional and can have a maximum length of 255 characters
  user: joi.string().hex().length(24).required() // Assuming user ID is a MongoDB ObjectId
})

const updateTransactionSchema = joi.object({
  amount: joi.number().min(0).optional(), // Amount must be a non-negative number if provided
  category: joi.string().hex().length(24).optional(), // Assuming category ID is a MongoDB ObjectId
  transactionDate: joi.date().iso().optional(), // Date must be in ISO format if provided
  type: joi.string().valid('income', 'expense').optional(), // Type must be either 'income' or 'expense' if provided
  description: joi.string().max(255).optional() // Description is optional and can have a maximum length of 255 characters
})

module.exports = {
  createTransactionSchema,
  updateTransactionSchema
};