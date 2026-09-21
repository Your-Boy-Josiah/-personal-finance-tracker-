const Joi = require('joi')
const regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$');

const registerSchema = Joi.object({
  firstName: Joi.string().alphanum().min(3).max(30).required(), // checks for alphanumeric characters and length between 3 and 30
  lastName: Joi.string().alphanum().min(3).max(30).required(), // checks for alphanumeric characters and length between 3 and 30
  email: Joi.string().email().required().min(6).max(60).email({tlds: {allow: ['com', 'net']}}).messages({
    "string.email": "enter a valid email (.com or .net)" // checks for valid email format
  }),
  password: Joi.string().min(6).required().pattern(regex).messages({
    "string.pattern.base": "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
  }),
  baseCurrency: Joi.string(), // checks for valid currency options
  monthlyIncome: Joi.number().min(0) // checks for non-negative monthly income
})

const loginSchema = Joi.object ({
  email: Joi.string().email().required(), // checks for valid email format
  password: Joi.string().required() // checks for required password
})

module.exports = { registerSchema, loginSchema }