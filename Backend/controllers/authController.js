// ===============================================================
//  authController.js
//  Handles authentication business logic including user
//  registration, login, password hashing, JWT generation,
//  profile management, and the forgot/reset password flow.
// ===============================================================

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ==============================================================
// HELPER FUNCTIONS
// ==============================================================

// Generates a secure JSON Web Token valid for 45 minutes
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '45m',
  });
};

// Hashes a raw reset token with SHA-256 before it touches the database,
// so a leaked database never exposes a usable reset token
const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
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
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName, // Accessing the virtual property
        email: user.email,
        role: user.role,                 // UPDATED: Include role
        baseCurrency: user.baseCurrency, // UPDATED: Include currency
        monthlyIncome: user.monthlyIncome,
        avatar: user.avatar,             // UPDATED: Include avatar on register
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
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,                 
        baseCurrency: user.baseCurrency, 
        monthlyIncome: user.monthlyIncome,
        avatar: user.avatar,            
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Generate a password reset token for the given email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Find the user by their email
    const user = await User.findOne({ email });

    // 2. Reply with a generic message either way, so requests can't be used
    // to confirm which emails are registered
    if (!user) {
      return res.status(200).json({
        message: 'If that email is registered, a reset token has been generated.',
      });
    }

    // 3. Generate a raw token to hand back, and store only its SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minute window

    await user.save();

    // 4. TEMPORARY: No email service is wired up yet, so the raw token is
    // returned directly in the response. Replace this with an emailed
    // reset link once a mailer (e.g. nodemailer) is added.
    return res.status(200).json({
      message: 'If that email is registered, a reset token has been generated.',
      resetToken: rawToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error generating reset token', error: error.message });
  }
};

// @desc    Reset a user's password using a valid reset token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // 1. Hash the incoming token the same way it was stored, then look it up
    const hashedToken = hashToken(req.params.token);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    // 2. Reject if the token is invalid or has expired
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // 3. Hash the new password securely using bcryptjs
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Clear the reset token so it cannot be reused
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error resetting password', error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'email', 'baseCurrency', 'monthlyIncome'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field]) => allowedFields.includes(field))
    );

    // Check if email is being taken by someone else
    if (updates.email && updates.email !== req.user.email) {
      const emailExists = await User.findOne({ email: updates.email });
      if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};

// @desc    Change the current user's password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const { currentPassword, newPassword } = req.body;

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
  }
};

// ============================================================== 
// @desc    Upload & update user profile avatar
// @route   PUT /api/auth/avatar
// @access  Private
// ============================================================== 
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    // Create the public URL path for the image
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: updatedUser, message: 'Avatar updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading avatar', error: error.message });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,           
  updateProfile,
  changePassword,
  uploadAvatar 
};
