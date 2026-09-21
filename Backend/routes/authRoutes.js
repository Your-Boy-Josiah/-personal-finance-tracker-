// ===============================================================
//  authRoutes.js
//  Defines the API endpoints for user authentication.
//  Maps HTTP requests to their respective controller functions.
// ===============================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const { registerUser, loginUser } = require('../controllers/authController');

/// import validation middleware

const validate = require('../utils/validate');

// Import Joi validation schemas for request body validation

const { registerSchema, loginSchema } = require('../validations/authSchema');

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

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
