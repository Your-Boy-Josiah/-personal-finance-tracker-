// ===============================================================
//  authRoutes.js
//  Defines the API endpoints for user authentication, including
//  the forgot/reset password flow.
// ===============================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');

/// import validation middleware

const validate = require('../utils/validate');

// Import Joi validation schemas for request body validation

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/authSchema');

// ==============================================================
// PUBLIC ROUTES
// ==============================================================

// @route   POST /api/auth/register
// @desc    Register a new user in the database
// @access  Public
router.post('/register', validate(registerSchema), registerUser);

// @route   POST /api/auth/login
// @desc    Verify credentials and return JWT token
// @access  Public
router.post('/login', validate(loginSchema), loginUser);

// @route   POST /api/auth/forgot-password
// @desc    Generate a password reset token for the given email
// @access  Public
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword); // UPDATED: new route for password reset flow

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset a user's password using a valid reset token
// @access  Public
router.put('/reset-password/:token', validate(resetPasswordSchema), resetPassword); // UPDATED: new route for password reset flow

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
