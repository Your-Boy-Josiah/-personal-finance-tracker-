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

### Budget and Advisory Files

* `Backend/models/Budget.js`
* `Backend/controllers/budgetController.js`
* `Backend/routes/budgetRoutes.js`
* `Backend/services/advisoryService.js`
* `Backend/controllers/advisoryController.js`
* `Backend/tests/budgetAdvisory.test.js`
* `Backend/app.js`

This section documents the Budget and Advisory budgeting and advisory task and was appended without removing the existing README documentation.

### Mock API Data and Usage Examples

The following examples use placeholder IDs. Replace them with real MongoDB `ObjectId` values from the authenticated user and the categories stored in the database.

#### Authentication Header

The budget and advisory routes are protected. Include the JWT returned by the login endpoint in every request:

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

#### Create or Update a Budget

Request:

```http
PUT /api/budget
```

Mock request body for a monthly income:

```json
{
  "monthlyIncome": 350000,
  "incomeFrequency": "monthly",
  "currency": "NGN",
  "categoryLimits": [
    {
      "category": "66f100000000000000000001",
      "spendingCap": 100000
    },
    {
      "category": "66f100000000000000000002",
      "spendingCap": 60000
    },
    {
      "category": "66f100000000000000000003",
      "spendingCap": 40000
    }
  ]
}
```

The same endpoint supports weekly income. The amount remains the value supplied by the user, while `incomeFrequency` records how that income is received:

```json
{
  "monthlyIncome": 87500,
  "incomeFrequency": "weekly",
  "currency": "NGN",
  "categoryLimits": []
}
```

Successful response example:

```json
{
  "_id": "66f200000000000000000001",
  "user": "66f000000000000000000001",
  "monthlyIncome": 350000,
  "incomeFrequency": "monthly",
  "currency": "NGN",
  "categoryLimits": [
    {
      "category": {
        "_id": "66f100000000000000000001",
        "name": "Rent",
        "type": "expense",
        "color": "#4A90E2"
      },
      "spendingCap": 100000
    }
  ],
  "createdAt": "2026-09-24T09:00:00.000Z",
  "updatedAt": "2026-09-24T09:00:00.000Z"
}
```

`PUT /api/budget` uses an upsert. If the authenticated user does not have a budget, MongoDB creates one. If the user already has a budget, the existing document is updated instead of creating a second budget.

#### Get the Current Budget

Request:

```http
GET /api/budget
```

The response contains the saved budget and populated category details. When the user has not created a budget yet, the endpoint returns an empty starting structure:

```json
{
  "user": "66f000000000000000000001",
  "categoryLimits": []
}
```

#### Record Mock Expense Transactions

Budget caps do not prevent transactions. For example, these expense records can be created through the existing transaction endpoint:

```http
POST /api/transactions
```

Essential expense example:

```json
{
  "type": "expense",
  "amount": 120000,
  "category": "66f100000000000000000001",
  "description": "Monthly rent payment",
  "transactionDate": "2026-09-05T10:00:00.000Z"
}
```

Non-essential expense example:

```json
{
  "type": "expense",
  "amount": 25000,
  "category": "66f100000000000000000002",
  "description": "Restaurant dinner",
  "transactionDate": "2026-09-12T19:30:00.000Z"
}
```

Miscellaneous expense example:

```json
{
  "type": "expense",
  "category": "66f100000000000000000003",
  "amount": 15000,
  "description": "Birthday gift",
  "transactionDate": "2026-09-15T14:00:00.000Z"
}
```

If the rent category has a `100000` cap, the `120000` rent transaction is still accepted. The advisory response records the category as `20000` over its cap rather than rejecting the transaction.

#### Get Financial Advice

Request:

```http
GET /api/budget/advisory
```

The service reviews expense transactions from the current calendar month. A representative response looks like this:

```json
{
  "period": {
    "start": "2026-09-01T00:00:00.000Z",
    "end": "2026-10-01T00:00:00.000Z"
  },
  "classificationTotals": {
    "essential": 120000,
    "miscellaneous": 15000,
    "non-essential/cut-back": 25000
  },
  "categoryTotals": [
    {
      "category": {
        "_id": "66f100000000000000000001",
        "name": "Rent",
        "type": "expense"
      },
      "spent": 120000
    },
    {
      "category": {
        "_id": "66f100000000000000000002",
        "name": "Dining",
        "type": "expense"
      },
      "spent": 25000
    }
  ],
  "overspentCategories": [
    {
      "category": {
        "_id": "66f100000000000000000001",
        "name": "Rent",
        "type": "expense"
      },
      "spendingCap": 100000,
      "spent": 120000,
      "amountOver": 20000
    }
  ],
  "advice": [
    {
      "category": {
        "_id": "66f100000000000000000001",
        "name": "Rent",
        "type": "expense"
      },
      "message": "Spending is 20000.00 over the cap. Review non-essential spending in this category and set a lower target for the rest of the month."
    },
    {
      "category": null,
      "message": "You spent 25000.00 on non-essential items this month. Consider redirecting part of this amount toward your savings goal."
    }
  ],
  "transactions": [
    {
      "transactionId": "66f300000000000000000001",
      "amount": 120000,
      "category": {
        "_id": "66f100000000000000000001",
        "name": "Rent",
        "type": "expense"
      },
      "description": "Monthly rent payment",
      "classification": "essential"
    },
    {
      "transactionId": "66f300000000000000000002",
      "amount": 25000,
      "category": {
        "_id": "66f100000000000000000002",
        "name": "Dining",
        "type": "expense"
      },
      "description": "Restaurant dinner",
      "classification": "non-essential/cut-back"
    }
  ]
}
```

#### Example Validation Errors

The budget update request must include `monthlyIncome`, `incomeFrequency`, and `currency`:

```json
{
  "monthlyIncome": 350000,
  "currency": "NGN"
}
```

Possible response:

```json
{
  "message": "Monthly income, income frequency, and currency are required"
}
```

`categoryLimits` must be an array, and a category may not appear more than once in that array:

```json
{
  "monthlyIncome": 350000,
  "incomeFrequency": "monthly",
  "currency": "NGN",
  "categoryLimits": [
    {
      "category": "66f100000000000000000001",
      "spendingCap": 100000
    },
    {
      "category": "66f100000000000000000001",
      "spendingCap": 120000
    }
  ]
}
```

Possible response:

```json
{
  "message": "Each category may only have one spending cap"
}
```