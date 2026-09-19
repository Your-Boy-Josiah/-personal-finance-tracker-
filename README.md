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
  