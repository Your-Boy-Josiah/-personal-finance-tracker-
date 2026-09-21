// ===============================================================
//  Category.js
//  Mongoose model defining the schema for transaction categories.
//  Organizes transactions into functional groups (e.g., Salary, Rent)
//  and allows users to create their own custom classifications.
// ===============================================================

const PM = require('mongoose'); 

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const categorySchema = new PM.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Category type must be either income or expense'],
    },
    user: {
      type: PM.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // If null, it can represent a default global category. If populated, it is a custom user category.
    },
    color: {
      type: String,
      trim: true,
      default: '#000000', // Hex code for frontend UI rendering
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

// Virtual: Helper boolean to quickly verify if the category is an expense
categorySchema.virtual('isExpense').get(function () {
  return this.type === 'expense';
});

// ============================================================
// MODEL COMPILATION & EXPORT
// Compiles the schema into a usable model and exports it
// ============================================================

const Category = PM.model('Category', categorySchema); 

module.exports = Category;
