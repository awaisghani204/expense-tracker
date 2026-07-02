const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./database");

const app = express();
const PORT = 3000;
const JWT_SECRET = "expense-tracker-secret-key-2024"; // For local dev

// ── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// ── Auth Middleware ───────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// ═══════════════════════════════════════════════════════
// ── AUTH ROUTES ───────────────────────────────────────
// ═══════════════════════════════════════════════════════

// ── POST /auth/signup ─────────────────────────────────
app.post("/auth/signup", (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  // Check if email already exists
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  // Hash password and create user
  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
  ).run(name.trim(), email.toLowerCase().trim(), hashedPassword);

  // Generate JWT
  const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: "7d" });

  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim() },
  });
});

// ── POST /auth/login ──────────────────────────────────
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Find user
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // Verify password
  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // Generate JWT
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// ── GET /auth/me ──────────────────────────────────────
app.get("/auth/me", authenticateToken, (req, res) => {
  const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  res.json({ user });
});
// ═══════════════════════════════════════════════════════
// ── BUDGET ROUTES (Protected) ─────────────────────────
// ═══════════════════════════════════════════════════════

// ── GET /budget ───────────────────────────────────────
app.get("/budget", authenticateToken, (req, res) => {
  const user = db.prepare("SELECT monthly_budget FROM users WHERE id = ?").get(req.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  res.json({ monthly_budget: user.monthly_budget || 0 });
});

// ── PUT /budget ───────────────────────────────────────
app.put("/budget", authenticateToken, (req, res) => {
  const { amount } = req.body;

  if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
    return res.status(400).json({ error: "A valid positive budget amount is required." });
  }

  db.prepare("UPDATE users SET monthly_budget = ? WHERE id = ?").run(amount, req.userId);
  res.json({ monthly_budget: amount });
});



// ═══════════════════════════════════════════════════════
// ── EXPENSE ROUTES (Protected) ───────────────────────
// ═══════════════════════════════════════════════════════

// ── GET /expenses ─────────────────────────────────────
app.get("/expenses", authenticateToken, (req, res) => {
  const { category } = req.query;
  let expenses;
  if (category && category !== "All") {
    expenses = db.prepare(
      "SELECT * FROM expenses WHERE user_id = ? AND category = ? ORDER BY id DESC"
    ).all(req.userId, category);
  } else {
    expenses = db.prepare(
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY id DESC"
    ).all(req.userId);
  }
  res.json(expenses);
});

// ── POST /expenses ────────────────────────────────────
app.post("/expenses", authenticateToken, (req, res) => {
  const { name, amount, date, category } = req.body;

  if (!name || !amount || !date || !category) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const result = db.prepare(
    "INSERT INTO expenses (name, amount, date, category, user_id) VALUES (?, ?, ?, ?, ?)"
  ).run(name, amount, date, category, req.userId);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    amount,
    date,
    category,
    user_id: req.userId,
  });
});

// ── PUT /expenses/:id ─────────────────────────────────
app.put("/expenses/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, amount, date, category } = req.body;

  if (!name || !amount || !date || !category) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Only update if this expense belongs to the logged-in user
  const result = db.prepare(
    "UPDATE expenses SET name = ?, amount = ?, date = ?, category = ? WHERE id = ? AND user_id = ?"
  ).run(name, amount, date, category, id, req.userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Expense not found." });
  }

  res.json({ id: Number(id), name, amount, date, category });
});

// ── DELETE /expenses/:id ──────────────────────────────
app.delete("/expenses/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const result = db.prepare(
    "DELETE FROM expenses WHERE id = ? AND user_id = ?"
  ).run(id, req.userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Expense not found." });
  }

  res.json({ success: true });
});

// ── Start server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT} ✅`);
});