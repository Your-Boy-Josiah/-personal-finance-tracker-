// ===============================================================
//  validate.js
//  Middleware to validate incoming HTTP request bodies against
//  pre-defined Joi schemas. Also acts as a strict bodyguard 
//  against NoSQL database injection attacks.
// ===============================================================

// ==============================================================
// NoSQL INJECTION BODYGUARD
// Recursively checks the request payload for illegal MongoDB
// operators (any keys starting with the '$' symbol).
// ==============================================================

const checkForNoSQLInjection = (obj) => {
  if (typeof obj !== 'object' || obj === null) return false;
  
  for (let key in obj) {
    if (key.startsWith('$')) {
      return true; // Malicious key found
    }
    // Check nested objects recursively
    if (typeof obj[key] === 'object' && checkForNoSQLInjection(obj[key])) {
      return true;
    }
  }
  return false;
};

// ==============================================================
// VALIDATION MIDDLEWARE
// ==============================================================

const validate = (schema) => (req, res, next) => {
  // 1. Security Check: Block NoSQL injection attempts immediately
  if (checkForNoSQLInjection(req.body)) {
    return res.status(403).json({ message: 'Forbidden: Malicious data structures detected' });
  }

  // 2. Joi Validation: Run the schema against the clean request body
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,  // Return ALL validation errors at once, not just the first one
    stripUnknown: true, // Automatically delete any extra fields the user maliciously tried to send
  });

  // 3. Error Handling: Format Joi errors into a readable array for the frontend
  if (error) {
    const errorMessages = error.details.map((err) => err.message.replace(/"/g, ''));
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errorMessages 
    });
  }

  // 4. Overwrite req.body with the sanitized and validated Joi data
  req.body = value;

  // 5. Pass control to the controller
  next();
};

// ============================================================
// EXPORT MIDDLEWARE
// ============================================================

module.exports = validate;
