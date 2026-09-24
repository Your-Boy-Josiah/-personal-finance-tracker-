### Personal-Finance-Tracker
Capstone Project for TS Academy 

## Initial Backend Setup & Architecture
* **Directory Scaffolding:** Configured modular backend hierarchy
 (`config`, `controllers`, `middleware`, `models`, `routes`, `services`, `tests`, `utils`).

* **Environment Setup:** Initialized Node runtime configuration (`package.json`), environment variables template (`.env`), and repository hygiene rules (`.gitignore`).

* **Mongoose Models:**
  * `User.js`: Schema with authentication lookups, soft-delete flag, and virtual `fullName`.
  * `Transaction.js`: Financial entry tracking with user references, indexing for queries/reports, and dynamic `formattedAmount` virtual.
  * Applied uniform JSDoc/block comment architecture across models.

## What is in the NEW COMMIT
# A more complete Backend Architecture

## Core API, Security, & Features (Recent Updates)
* **Authentication & Security:** 
  * Implemented JWT (JSON Web Token) generation and verification.
  * Integrated `bcryptjs` for secure password hashing during user registration.
  * Built public `register` and `login` endpoints in `authController.js`.

* **Custom Middleware:**
  * `authMiddleware.js`: Protects private routes by extracting/verifying Bearer tokens, mapping the active user, and immediately blocking requests from soft-deleted accounts.
  * `errorMiddleware.js`: Overrides default Express HTML errors with structured JSON responses, safely hiding stack traces in production.

* **Schema Enhancements:**
  * Upgraded `User.js` with production-ready fields including `role` (user/admin), `baseCurrency` preference, and account recovery infrastructure.
  * Created `Category.js`: Supports both global default categories (user: null) and custom user-specific categories.
  * Refactored `Transaction.js`: Converted the `category` field from a String to a relational `ObjectId`, linking directly to the Category model to unlock Mongoose `.populate()`.

* **RESTful Controllers & Routes:**
  * Completed fully protected CRUD operations for Categories (`categoryController.js`).
  * Completed fully protected CRUD operations for Transactions (`transactionController.js`).
  * Mounted all endpoint groups cleanly inside `app.js`.

* **Dashboard & Analytics:**
  * Created `dashboardController.js` utilizing **MongoDB Aggregation Pipelines**.
  * Offloads heavy math to the database to calculate total income, total expenses, and net balance efficiently, ensuring server stability as transaction volumes grow.

## Budgeting & Advisory Task

This task adds a separate budgeting and financial advisory layer while preserving the existing transaction and bank-sync flows.

### Budget Schema and Frequency Setup

`models/Budget.js` stores one budget document per authenticated user. It references `User` through an `ObjectId` and requires `monthlyIncome`, `incomeFrequency`, and `currency`. The `incomeFrequency` value is restricted to `monthly` or `weekly`, keeping income planning consistent across the application.

The budget also contains a `categoryLimits` array. Each embedded limit stores a `category` reference and a numeric `spendingCap`. The category limit is embedded in the budget document because it belongs to that user's planning configuration; it is not a separate top-level model.

### Budget CRUD and Overspending Flow

The protected routes are:

* `GET /api/budget`: loads the logged-in user's budget.
* `PUT /api/budget`: creates the user's first budget or updates the existing budget with `findOneAndUpdate` and `upsert`.

The authenticated user ID comes from `req.user._id`, which is populated by the existing JWT middleware. This ensures users can only read and update their own budget. Spending caps are targets rather than hard restrictions, so expenses may exceed a cap and remain valid transactions. The advisory service detects and reports those overages afterward.

### Advisory and Tagging Engine

`services/advisoryService.js` reads the user's current-month expense transactions and classifies each one as:

* `essential`: necessities such as rent, groceries, health, transport, education, or insurance.
* `non-essential/cut-back`: optional spending such as dining, entertainment, shopping, subscriptions, travel, or gaming.
* `miscellaneous`: transactions that do not match either keyword group, including uncategorized bank transactions.

The service aggregates totals by classification and category, compares category totals against saved spending caps, identifies overspent categories, and creates actionable cut-back advice. It never blocks, deletes, or rewrites a transaction.

The protected advisory endpoint is `GET /api/budget/advisory`. It returns the current period, classification totals, category totals, overspent categories, recommendations, and classified transactions.

### End-to-End Flow

1. A user authenticates and receives a JWT.
2. The frontend calls `GET /api/budget` to load the user's planning settings.
3. The frontend calls `PUT /api/budget` to save income, frequency, currency, and category caps.
4. The user records expenses through the existing transaction API or bank synchronization flow.
5. The frontend calls `GET /api/budget/advisory`.
6. The advisory service summarizes spending, reports overages, and returns financial guidance.

### API Testing
For detailed API request payloads and testing flows, please refer to the `CLIENT-Test.rest` file included in the root directory.
