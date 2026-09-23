// ===============================================================
//  Transaction.js
//  Mongoose model defining the schema for user transactions.
//  Handles core financial records (income/expenses), relational
//  links to Users, and dynamic virtual properties.
// ===============================================================

const PM = require('mongoose'); 

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const transactionSchema = new PM.Schema(
  {
    user: {
      type: PM.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user'],
      index: true, // Indexed to quickly fetch a specific user's transaction history
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: PM.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Transaction category is required'],
      index: true, // Indexed for fast filtering by category in the frontend
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true, // Indexed for fast sorting and monthly reporting
    },

    // ==========================================================
    // BANK SYNC FIELDS (Task B-1)
    // Populated when a transaction originates from a linked bank
    // account via Mono/Okra sync, rather than manual user entry.
    // ==========================================================
    bankTransactionId: {
      type: String,
      index: true,
      sparse: true, // allows manually-added transactions without this field
    },
    bankName: {
      type: String,
      default: null,
    },
    merchant: {
      type: String,
      default: null,
    },
    rawDescription: {
      type: String,
      default: null, // unprocessed description string as returned by the bank API
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
// COMPOUND INDEXES
// ============================================================

// Prevents duplicate bank-synced transactions per user. Only enforced on documents that actually have a bankTransactionId, so manually entered transactions are unaffected. 
// This is what B-3's bulkWrite
// upsert logic relies on for idempotency.
transactionSchema.index(
  { user: 1, bankTransactionId: 1 },
  { unique: true, partialFilterExpression: { bankTransactionId: { $exists: true } } }
);

// ============================================================
// VIRTUAL PROPERTIES
// Dynamic fields that are computed on-the-fly when requested.
// These are NOT saved to the MongoDB database, saving space.
// ============================================================

// Virtual: Format the amount with a strict +/- sign for frontend display
transactionSchema.virtual('formattedAmount').get(function () {
  return this.type === 'expense' ? `-${this.amount}` : `+${this.amount}`;
});

// ============================================================
// MODEL COMPILATION & EXPORT
// Compiles the schema into a usable model and exports it
// ============================================================

const Transaction = PM.model('Transaction', transactionSchema); 

module.exports = Transaction;
