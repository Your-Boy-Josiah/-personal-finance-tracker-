// ===============================================================
//  authRoutes.js
//  Defines the API endpoints for user authentication, including
//  profile management, password resets, and avatar file uploads.
// ===============================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Import controller functions
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword,
  getMe,           
  updateProfile,   
  changePassword,
  uploadAvatar      // ADDED: Avatar upload controller
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware'); 
const validate = require('../utils/validate');

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validations/authSchema');

// ==============================================================
// MULTER CONFIGURATION (IMAGE UPLOADS)
// ==============================================================

const avatarDirectory = path.join(__dirname, '..', 'uploads', 'avatars');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdir(avatarDirectory, { recursive: true }, (error) => cb(error, avatarDirectory));
  },
  filename(req, file, cb) {
    // Creates a unique filename: e.g., avatar-163456789.jpg
    cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const checkFileType = (file, cb) => {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (JPG, JPEG, PNG)!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

// ==============================================================
// PUBLIC ROUTES
// ==============================================================

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword); 
router.put('/reset-password/:token', validate(resetPasswordSchema), resetPassword); 

// ==============================================================
// PRIVATE ROUTES
// ==============================================================

router.get('/me', protect, getMe);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/password', protect, validate(changePasswordSchema), changePassword);

// NEW: Avatar upload route using Multer middleware
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
