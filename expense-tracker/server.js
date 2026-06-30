const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

// ── Middleware ────────────────────────────────────────
app.use(cors());                            // allow frontend to talk to server
app.use(express.json());                    // parse incoming JSON
app.use(express.static("."));              // serve your index.html

// ── GET /expenses ─────────────────────────────────────
// Reads all expenses from database and sends as JSON
app.get("/expenses", (req, res) => {
  const expenses = db.prepare("SELECT * FROM expenses ORDER BY id DESC").all();
  res.json(expenses);
});

// ── POST /expenses ────────────────────────────────────
// Receives new expense from frontend and saves to database
app.post("/expenses", (req, res) => {
  const { name, amount, date, category } = req.body;

  // Basic validation
  if (!name || !amount || !date || !category) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const insert = db.prepare(
    "INSERT INTO expenses (name, amount, date, category) VALUES (?, ?, ?, ?)"
  );

  const result = insert.run(name, amount, date, category);

  // Send back the newly created expense
  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    amount,
    date,
    category,
  });
});

// ── PUT /expenses/:id ─────────────────────────────────
// Updates an existing expense by id
app.put("/expenses/:id", (req, res) => {
  const { id } = req.params;
  const { name, amount, date, category } = req.body;

  if (!name || !amount || !date || !category) {
    return res.status(400).json({ error: "All fields are required." });
  }

  db.prepare(
    "UPDATE expenses SET name = ?, amount = ?, date = ?, category = ? WHERE id = ?"
  ).run(name, amount, date, category, id);

  res.json({
    id: Number(id),
    name,
    amount,
    date,
    category,
  });
});

// ── DELETE /expenses/:id ──────────────────────────────
// Deletes an expense by id
app.delete("/expenses/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  res.json({ success: true });
});

// ── Start server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT} ✅`);
});