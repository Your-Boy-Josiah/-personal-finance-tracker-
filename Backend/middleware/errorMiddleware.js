// ===============================================================
//  errorMiddleware.js
//  Custom error handling middleware to provide structured
//  JSON responses for API errors instead of HTML stack traces.
// ===============================================================

// ==============================================================
// ERROR HANDLER
// ==============================================================

const errorHandler = (err, req, res, next) => {
  // Determine the status code. If it is still 200 despite an error, force it to 500
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false, // Ensures consistent API response structures
    message: err.message,
    // Only show the detailed stack trace in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

// ============================================================
// EXPORT MIDDLEWARE
// ============================================================

module.exports = { errorHandler };
