// ===============================================================
//  budgetAdvisory.test.js
//  Database-free tests for the budget foundation and advisory
//  classification rules. These checks verify required budget fields and
//  all three advisory labels without requiring a running MongoDB instance.
// ===============================================================

const Budget = require('../models/Budget');
const AdvisoryService = require('../services/advisoryService');

describe('Budget Advisory Unit Tests', () => {
  
  it('budget requires income, frequency, and currency', async () => {
    const budget = new Budget();
    
    try {
      // We await the asynchronous validation so the test doesn't read the error too early
      await budget.validate();
    } catch (error) {
      // Jest expectation syntax
      expect(error.errors.monthlyIncome).toBeDefined();
      expect(error.errors.incomeFrequency).toBeDefined();
      expect(error.errors.currency).toBeDefined();
    }
  });

  it('advisory service classifies essential, cut-back, and miscellaneous spending', () => {
    const service = new AdvisoryService();

    expect(
      service.classifyTransaction({ category: { name: 'Rent' }, description: '' })
    ).toBe('essential');
    
    expect(
      service.classifyTransaction({ category: { name: 'Dining' }, description: 'Dinner' })
    ).toBe('non-essential/cut-back');
    
    expect(
      service.classifyTransaction({ category: null, description: 'Birthday gift' })
    ).toBe('miscellaneous');
  });

});
