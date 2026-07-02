const Database = require("better-sqlite3");

// Creates expenses.db file automatically if it doesn't exist
const db = new Database("expenses.db");

// ── Enable WAL mode for better performance ────────────
db.pragma("journal_mode = WAL");

// ── Create the users table ────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    email          TEXT    NOT NULL UNIQUE,
    password       TEXT    NOT NULL,
    monthly_budget REAL    DEFAULT 0
  )
`);

// Check if users table already has the monthly_budget column
const userTableInfo = db.prepare("PRAGMA table_info(users)").all();
const hasMonthlyBudget = userTableInfo.some(col => col.name === "monthly_budget");

if (!hasMonthlyBudget) {
  db.exec(`ALTER TABLE users ADD COLUMN monthly_budget REAL DEFAULT 0`);
  console.log("Migrated users table — added monthly_budget column ✅");
}

// ── Create the expenses table (with user_id) ──────────
// Check if expenses table already exists
const tableInfo = db.prepare("PRAGMA table_info(expenses)").all();

if (tableInfo.length === 0) {
  // Fresh table — create with user_id from the start
  db.exec(`
    CREATE TABLE expenses (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT    NOT NULL,
      amount   REAL    NOT NULL,
      date     TEXT    NOT NULL,
      category TEXT    NOT NULL,
      user_id  INTEGER REFERENCES users(id)
    )
  `);
} else {
  // Table exists — check if user_id column is already there
  const hasUserId = tableInfo.some(col => col.name === "user_id");
  if (!hasUserId) {
    db.exec(`ALTER TABLE expenses ADD COLUMN user_id INTEGER REFERENCES users(id)`);
    // Clean start: delete orphaned expenses (no user_id)
    db.exec(`DELETE FROM expenses WHERE user_id IS NULL`);
    console.log("Migrated expenses table — orphaned records cleaned ✅");
  }
}

console.log("Database ready ✅");

module.exports = db;