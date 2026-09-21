const joi = require('joi')

// Define the schema for category validation. With this we determine what to expect from the inut data and how to validate it. This ensures that the data is in the correct format before it is processed or stored in the database.
const categorySchema = joi.object({
  name: joi.string().min(2).max(100).required(),
  type: joi.string().valid('income', 'expense').required(),
  color: joi.string().pattern(/^#([0-9A-F]{3}){1,2}$/i).optional(),
  user: joi.string().hex().length(24).required(), // Assuming user ID is a MongoDB ObjectId
  description: joi.string().max(255).optional()
})

module.exports = categorySchema
