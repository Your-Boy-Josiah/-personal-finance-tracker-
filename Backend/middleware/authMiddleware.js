// ===============================================================
//  authMiddleware.js
//  Security middleware to protect private API routes.
//  Verifies the presence and validity of a JSON Web Token (JWT).
// ===============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==============================================================
// TOKEN VERIFICATION MIDDLEWARE
// ==============================================================

const protect = async (req, res, next) => {
  let token;

  // 1. Check if the authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract the token from the 'Bearer <token>' string
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token using your environment secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Fetch the user from the database (excluding the password) 
      // and attach their data to the request object
      req.user = await User.findById(decoded.id).select('-password');

      // 5. UPDATED: Reject the request if the user does not exist or is soft-deleted
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: 'Not authorized, account deactivated' });
      }

      // 6. Pass control to the next middleware or the actual controller
      next();
    } catch (error) {
      console.error(`Token Verification Error: ${error.message}`);
      // Send response and return to prevent further execution
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // 7. Block access if no token was provided at all
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// ============================================================
// EXPORT MIDDLEWARE
// ============================================================

module.exports = { protect };
