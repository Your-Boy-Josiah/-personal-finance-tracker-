// ===============================================================
//  budgetController.js
//  Handles the Team C budget foundation flow: retrieving the logged-in
//  user's budget settings and upserting the document with monthly
//  income, frequency, currency, and category spending caps. This layer
//  does not block overspending; it stores caps for later comparison.
// ===============================================================

const Budget = require('../models/Budget');

// ============================================================== 
// @desc    Get the current budget for the logged-in user
// @route   GET /api/budget
// @access  Private
// ============================================================== 
const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ user: req.user._id }).populate(
      'categoryLimits.category',
      'name type color'
    );

    res.status(200).json(budget || { user: req.user._id, categoryLimits: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching budget', error: error.message });
  }
};

// ============================================================== 
// @desc    Create or update the current budget for the logged-in user
// @route   PUT /api/budget
// @access  Private
// Upsert creates the first budget and updates it on later requests.
// Overspending is allowed because this endpoint only stores planning
// targets; transaction creation remains independent of these caps.
// ============================================================== 
const updateBudget = async (req, res) => {
  try {
    const { monthlyIncome, incomeFrequency, currency, categoryLimits } = req.body;

    if (monthlyIncome === undefined || !incomeFrequency || !currency) {
      return res.status(400).json({
        message: 'Monthly income, income frequency, and currency are required',
      });
    }

    if (categoryLimits !== undefined) {
      if (!Array.isArray(categoryLimits)) {
        return res.status(400).json({ message: 'Category limits must be an array' });
      }

      const categoryIds = categoryLimits.map((limit) => String(limit.category));
      if (new Set(categoryIds).size !== categoryIds.length) {
        return res.status(400).json({ message: 'Each category may only have one spending cap' });
      }
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id },
      { user: req.user._id, monthlyIncome, incomeFrequency, currency, categoryLimits },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('categoryLimits.category', 'name type color');

    res.status(200).json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating budget', error: error.message });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = { getBudget, updateBudget };
