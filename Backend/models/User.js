// ===============================================================
//  User.js
//  Mongoose model defining the schema for the application's users.
//  Handles core user details, authentication indexing, and
//  dynamic virtual properties (like full name).
// ===============================================================

const PM = require('mongoose'); 

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const userSchema = new PM.Schema(
  {
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
    currencyPreference: {
      type: String,
      enum: ['NGN', 'USD', 'EUR', 'GBP'],
      default: 'NGN', // Default set to NGN, can be updated by the user in settings
    },
    isActive: {
      type: Boolean,
      default: true, 
      // Soft delete mechanism: set to false instead of permanently deleting users to preserve financial history links
    },
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
