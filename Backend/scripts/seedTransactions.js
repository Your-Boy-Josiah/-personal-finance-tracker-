// ===============================================================
//  seedTransactions.js
//  Fixes old test transactions by mapping them to the newly 
//  created global categories so they display correctly on the UI.
// ===============================================================

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

dotenv.config();

const fixTransactions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // 1. Fetch the global categories you just seeded
    const categories = await Category.find({ user: null });
    
    if (categories.length === 0) {
      console.log('No categories found! Please run seedCategories.js first.');
      process.exit(1);
    }

    // 2. Separate them by type so we don't mix income/expenses
    const incomeCats = categories.filter(c => c.type === 'income');
    const expenseCats = categories.filter(c => c.type === 'expense');

    // 3. Fetch all existing test transactions
    const transactions = await Transaction.find({});
    let updatedCount = 0;

    // 4. Update each transaction with a valid, colorful category
    for (let tx of transactions) {
      if (tx.type === 'income' && incomeCats.length > 0) {
        tx.category = incomeCats[Math.floor(Math.random() * incomeCats.length)]._id;
      } else if (tx.type === 'expense' && expenseCats.length > 0) {
        tx.category = expenseCats[Math.floor(Math.random() * expenseCats.length)]._id;
      }
      await tx.save();
      updatedCount++;
    }

    console.log(`Success! Fixed and categorized ${updatedCount} old transactions.`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

fixTransactions();
