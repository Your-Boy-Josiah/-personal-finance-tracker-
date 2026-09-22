// ===============================================================
//  authSchema.js
//  Joi validation schemas for user authentication routes.
//  Ensures secure passwords, valid emails, and proper string formatting.
// ===============================================================

const Joi = require('joi');

// Regex: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$');

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters long'
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Last name is required'
  }),
  email: Joi.string().email().required().trim().lowercase().min(6).max(60).messages({
    'string.email': 'Please enter a valid email address'
  }),
  password: Joi.string().min(8).required().pattern(passwordRegex).messages({
    'string.pattern.base': 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&)'
  }),
  baseCurrency: Joi.string().length(3).optional(), // e.g., 'NGN', 'USD'
  monthlyIncome: Joi.number().min(0).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase().messages({
    'string.email': 'Please enter a valid email address'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

// ============================================================
// EXPORT SCHEMAS
// ============================================================
module.exports = { registerSchema, loginSchema };
