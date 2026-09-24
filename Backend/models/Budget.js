// ===============================================================
//  Budget.js
//  Mongoose model that stores each user's budget foundation for the
//  Team C budgeting and advisory workflow. This document is created
//  once per user and acts as the master source of truth for income,
//  spending caps, and category-level budget rules. The schema keeps
//  this data separate from raw transactions so the system can compare
//  actual spending against budget limits without modifying the
//  transaction ledger itself.
// ===============================================================

const mongoose = require('mongoose');

// ==============================================================
// SUB-SCHEMA: CATEGORY SPENDING CAP
// Each category can have one cap inside a user's budget. Expenses may
// exceed the cap; the cap is a comparison target used by the advisory
// service to calculate overspending and recommend cut-backs.
// ==============================================================
const categoryLimitSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Budget category is required'],
    },
    spendingCap: {
      type: Number,
      required: [true, 'Spending cap is required'],
      min: [0, 'Spending cap cannot be negative'],
    },
  },
  { _id: false }
);

// ==============================================================
// SCHEMA DEFINITION
// One authenticated user owns one budget document. The embedded
// categoryLimits array keeps income settings and category targets
// together so the advisory service can read one planning record.
// ==============================================================
const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Budget must belong to a user'],
      unique: true,
      index: true,
    },
    monthlyIncome: {
      type: Number,
      required: [true, 'Monthly income is required'],
      min: [0, 'Monthly income cannot be negative'],
    },
    incomeFrequency: {
      type: String,
      enum: ['monthly', 'weekly'],
      required: [true, 'Income frequency must be monthly or weekly'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
      uppercase: true,
    },
    categoryLimits: {
      type: [categoryLimitSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// ============================================================
// MODEL COMPILATION & EXPORT
// ============================================================

module.exports = mongoose.model('Budget', budgetSchema);
