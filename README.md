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