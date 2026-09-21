// ===============================================================
//  database.js
//  Establishes the connection to MongoDB using Mongoose.
//  Handles connection success and error logging.
// ===============================================================

const mongoose = require('mongoose');

// ==============================================================
// DATABASE CONNECTION FUNCTION
// ==============================================================

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure code if connection fails
  }
};

// ============================================================
// EXPORT CONNECTION FUNCTION
// ============================================================

module.exports = connectDB;
