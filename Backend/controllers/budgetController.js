// ===============================================================
//  budgetController.js
//  Handles the budget foundation flow: retrieving the logged-in
//  user's budget settings and upserting the document with monthly
//  income, frequency, currency, and category spending caps. This layer
//  does not block overspending; it stores caps for later comparison.
// ===============================================================

const Budget = require('../models/Budget');
const Category = require('../models/Category');

// ============================================================== 
// @desc    Get the current budget for the logged-in user
// @route   GET /api/budget
// @access  Private
// ============================================================== 
const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ user: req.user._id }).populate({
      path: 'categoryLimits.category',
      select: 'name type color',
      match: { $or: [{ user: req.user._id }, { user: null }], type: 'expense' },
    });

    if (budget) {
      budget.categoryLimits = budget.categoryLimits.filter((limit) => limit.category);
    }

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

      // FIX: Validate uniqueness based on the combination of category AND subCategory.
      // This allows you to have separate budgets for "Food -> Groceries" and "Food -> Snacks".
      const limitKeys = categoryLimits.map((limit) => {
        const catId = String(limit.category);
        const sub = limit.subCategory ? limit.subCategory.trim().toLowerCase() : 'MAIN';
        return `${catId}_${sub}`;
      });

      if (new Set(limitKeys).size !== limitKeys.length) {
        return res.status(400).json({ message: 'Each category/sub-category combination may only have one spending cap' });
      }

      const categoryIds = [...new Set(categoryLimits.map((limit) => String(limit.category)))];
      const categories = await Category.find({
        _id: { $in: categoryIds },
        type: 'expense',
        $or: [{ user: req.user._id }, { user: null }],
      }).select('_id subCategories');
      const categoriesById = new Map(categories.map((category) => [String(category._id), category]));

      for (const limit of categoryLimits) {
        const category = categoriesById.get(String(limit.category));
        if (!category) {
          return res.status(400).json({ message: 'Invalid budget category selection' });
        }
        if (limit.subCategory && !category.subCategories.includes(limit.subCategory.trim())) {
          return res.status(400).json({ message: 'Sub-category is not valid for the selected category' });
        }
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

module.exports = { 
  getBudget, 
  updateBudget 
};
