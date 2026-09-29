// ===============================================================
//  seedCategories.js
//  Injects global default categories (user: null) into the database.
//  Run this once via: node scripts/seedCategories.js
// ===============================================================

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');

dotenv.config();

const defaultCategories = [
  { name: 'Salary', type: 'income', color: '#10b981', user: null },
  { name: 'Investments', type: 'income', color: '#3b82f6', user: null },
  { name: 'Food & Dining', type: 'expense', color: '#f43f5e', user: null },
  { name: 'Rent & Utilities', type: 'expense', color: '#f59e0b', user: null },
  { name: 'Transportation', type: 'expense', color: '#8b5cf6', user: null }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
    
    // Optional: await Category.deleteMany({ user: null }); // Clear old defaults
    await Category.insertMany(defaultCategories);
    
    console.log('Global Default Categories Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
