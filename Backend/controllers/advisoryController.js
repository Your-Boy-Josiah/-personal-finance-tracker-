// ===============================================================
//  advisoryController.js
//  API controller for the Team C budgeting advice flow. It delegates
//  calculations to the advisory service and returns the result as JSON,
//  keeping the route layer separate from business logic.
// ===============================================================

const AdvisoryService = require('../services/advisoryService');

const advisoryService = new AdvisoryService();

// ============================================================== 
// @desc    Generate monthly spending advice for the logged-in user
// @route   GET /api/budget/advisory
// @access  Private
// ============================================================== 
const getAdvisory = async (req, res) => {
  try {
    const advisory = await advisoryService.getAdvice(req.user._id);
    res.status(200).json(advisory);
  } catch (error) {
    res.status(500).json({ message: 'Server error generating financial advice', error: error.message });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = { getAdvisory };
