# Personal Finance Tracker - Backend API

A complete, production-ready RESTful backend for a Personal Finance Tracker. Built with Express.js and MongoDB, this API handles secure user authentication, complex financial data aggregations, strict budgeting rules, and intelligent financial advisory.

## 🏗 Process Workflow & Architecture

The backend was developed through a modular, feature-based workflow, ensuring high test coverage and strict data integrity. 

1. **Environment & Scaffolding:** Configured the Node runtime, environment variables, and modular directory structure (`controllers`, `models`, `routes`, `middleware`, `services`).
2. **Database & Data Modeling:** Implemented Mongoose v8 schemas for `User`, `Category`, `Transaction`, and `Budget`, utilizing relational ObjectIds, virtuals (e.g., `formattedAmount`), and block-comment architecture.
3. **Security & Authentication:** Built a robust JWT authentication flow with bcryptjs password hashing and custom middleware to protect private routes and reject soft-deleted accounts.
4. **Core CRUD & Routing:** Developed RESTful endpoints for Category management and Transaction logging.
5. **Advanced Data Operations:** Implemented MongoDB Aggregation Pipelines to offload heavy dashboard math to the database, and utilized Mongoose Replica Sets/Sessions to handle ACID-compliant cascading deletes.
6. **Testing & QA:** Verified all endpoints via Jest automated tests and manual REST Client verification.

## ⚙️ Core Features & Capabilities

### Security & Error Handling
* **JWT Authentication:** Secure token generation and validation for all private routes.
* **Custom Middleware:** 
  * `authMiddleware.js`: Validates Bearer tokens and maps the active user to the request.
  * `errorMiddleware.js`: Overrides Express default errors with structured, production-safe JSON responses.

### Financial Transactions & Categories
* **Category Engine:** Supports immutable global default categories alongside custom, user-defined categories.
* **Transaction Tracking:** Logs income and expenses. The `category` field is a relational `ObjectId` linking directly to the Category model, enabling Mongoose `.populate()`.
* **ACID Cascading Deletes:** If a category is deleted, a MongoDB transaction safely intercepts all orphaned financial entries and reassigns them to an "Uncategorized" bucket to preserve financial history.

### Dashboard & Aggregations
* **Database-Level Math:** The `/api/dashboard/summary` endpoint utilizes native MongoDB Aggregation Pipelines to calculate total income, total expenses, and net balance. This ensures high performance and server stability regardless of transaction volume.

### Budgeting & Advisory Engine
* **Dynamic Budgeting:** Users can establish a `monthlyIncome`, `incomeFrequency`, and assign targeted `spendingCap` limits to specific categories.
* **Automated Classification:** The `advisoryService.js` engine reads the current month's expenses and automatically classifies them into `essential`, `non-essential/cut-back`, or `miscellaneous` buckets.
* **Gamified Advisory:** The engine compares real-time category totals against saved spending caps. It identifies overages and generates actionable financial guidance without ever mutating or blocking the original transactions.

## 🧪 API Testing & Integration

The backend is fully verified. A comprehensive `CLIENT-Test.rest` file is included in the root directory. It contains parameterized HTTP requests for testing the entire user lifecycle, from registration and JWT generation to budget capping and transaction cascading, using the VS Code REST Client extension.
