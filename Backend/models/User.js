// ===============================================================
//  User.js
//  Mongoose model defining the schema for the application's users.
//  Handles core user details, authentication indexing, financial
//  preferences, and security management fields.
// ===============================================================

const PM = require('mongoose'); 

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const userSchema = new PM.Schema(
  {
    // 1. Core Requirements (Authentication & Identity)
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required for login'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true, // Indexed for lightning-fast authentication lookups during login
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      // Note: Business logic in the controller must hash this using bcrypt before saving
    },

    // 2. Finance-Specific Optionals
    baseCurrency: {
      type: String,
      enum: ['NGN', 'USD', 'EUR', 'GBP'],
      default: 'NGN', // Default set to NGN, critical for accurate dashboard summaries
    },
    monthlyIncome: {
      type: Number,
      default: 0, // Baseline income for budget comparisons without requiring manual transaction entries
    },

    // 3. Account Management & Security
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user', // Allows for future admin dashboards to manage the platform
    },
    isVerified: {
      type: Boolean,
      default: false, // Prevents fake accounts; requires email verification link click
    },
    isActive: {
      type: Boolean,
      default: true, 
      // Soft delete mechanism: set to false instead of permanently deleting users to preserve financial history links
    },
    resetPasswordToken: {
      type: String, // Temporarily stores the generated token for password resets
    },
    resetPasswordExpires: {
      type: Date, // Sets an expiration window for the reset token
    }
  },
  // ============================================================
  // SCHEMA OPTIONS
  // ============================================================
  { 
    timestamps: true,              // Automatically adds 'createdAt' and 'updatedAt' fields
    toJSON: { virtuals: true },    // Tells Mongoose to include virtuals in API JSON responses
    toObject: { virtuals: true }   // Tells Mongoose to include virtuals in standard console.logs
  }
);

// ============================================================
// VIRTUAL PROPERTIES
// Dynamic fields that are computed on-the-fly when requested.
// These are NOT saved to the MongoDB database, saving space.
// ============================================================

// Virtual: Combine first and last name for easy frontend display and greetings
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`; 
});

// ============================================================
// MODEL COMPILATION & EXPORT
// Compiles the schema into a usable model and exports it
// ============================================================

const User = PM.model('User', userSchema); 

module.exports = User;
