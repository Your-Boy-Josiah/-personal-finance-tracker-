// ===============================================================
//  budgetAdvisory.test.js
//  Database-free tests for the Team C budget foundation and advisory
//  classification rules. These checks verify required budget fields and
//  all three advisory labels without requiring a running MongoDB instance.
// ===============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const Budget = require('../models/Budget');
const AdvisoryService = require('../services/advisoryService');

test('budget requires income, frequency, and currency', () => {
  const error = new Budget().validateSync();

  assert.ok(error.errors.monthlyIncome);
  assert.ok(error.errors.incomeFrequency);
  assert.ok(error.errors.currency);
});

test('advisory service classifies essential, cut-back, and miscellaneous spending', () => {
  const service = new AdvisoryService();

  assert.equal(
    service.classifyTransaction({ category: { name: 'Rent' }, description: '' }),
    'essential'
  );
  assert.equal(
    service.classifyTransaction({ category: { name: 'Dining' }, description: 'Dinner' }),
    'non-essential/cut-back'
  );
  assert.equal(
    service.classifyTransaction({ category: null, description: 'Birthday gift' }),
    'miscellaneous'
  );
});
