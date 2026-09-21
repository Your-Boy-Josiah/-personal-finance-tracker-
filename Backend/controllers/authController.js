// ===============================================================
//  authController.js
//  Handles authentication business logic including user
//  registration, login, password hashing, and JWT generation.
// ===============================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ==============================================================
// HELPER FUNCTIONS
// ==============================================================

// Generates a secure JSON Web Token valid for 30 days
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ==============================================================
// CONTROLLER FUNCTIONS
// ==============================================================

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // 1. Validation check
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 3. Hash the password securely using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the new user in MongoDB
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // 5. Send success response with token and new preference fields
    if (user) {
      res.status(201).json({
        _id: user.id,
        fullName: user.fullName, // Accessing the virtual property
        email: user.email,
        role: user.role,                 // UPDATED: Include role
        baseCurrency: user.baseCurrency, // UPDATED: Include currency
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by their email
    const user = await User.findOne({ email });

    // 2. UPDATED: Block login if the account is deactivated (soft deleted)
    if (user && !user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }

    // 3. Compare incoming plain text password to the hashed database password
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,                 // UPDATED: Include role
        baseCurrency: user.baseCurrency, // UPDATED: Include currency
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  registerUser,
  loginUser,
};
