// ===============================================================
//  authRoutes.js
//  Defines the API endpoints for user authentication.
//  Maps HTTP requests to their respective controller functions.
// ===============================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const { registerUser, loginUser } = require('../controllers/authController');

// ==============================================================
// PUBLIC ROUTES
// ==============================================================

// @route   POST /api/auth/register
// @desc    Register a new user in the database
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Verify credentials and return JWT token
// @access  Public
router.post('/login', loginUser);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
