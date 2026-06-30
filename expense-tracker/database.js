const Database = require("better-sqlite3");

// Creates expenses.db file automatically if it doesn't exist
const db = new Database("expenses.db");

// Create the expenses table
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    amount   REAL    NOT NULL,
    date     TEXT    NOT NULL,
    category TEXT    NOT NULL
  )
`);

console.log("Database ready ✅");

module.exports = db;