// ===============================================================
//  app.js
//  Main entry point for the Express server.
//  Initializes middleware, loads environment variables, 
//  connects to MongoDB, and mounts API routes.
// ===============================================================

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorMiddleware');

// ==============================================================
// ENVIRONMENT CONFIGURATION & DATABASE SETUP
// ==============================================================

dotenv.config();

// Establish MongoDB connection
connectDB();

// ==============================================================
// EXPRESS APP INITIALIZATION
// ==============================================================

const app = express();

// ==============================================================
// MIDDLEWARE SETUP
// ==============================================================

app.use(cors()); // Enables Cross-Origin Resource Sharing for the React frontend
app.use(express.json()); // Parses incoming JSON payloads in request bodies

// ==============================================================
// API ROUTES
// ==============================================================

// Base health check route to verify server status
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Personal Finance Tracker API is running successfully',
  });
});

// Mounted API endpoints 
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// ==============================================================
// CUSTOM ERROR HANDLING
// ==============================================================

// Must be mounted AFTER all API routes to catch unhandled errors
app.use(errorHandler);

// ==============================================================
// SERVER LISTENING
// ==============================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
