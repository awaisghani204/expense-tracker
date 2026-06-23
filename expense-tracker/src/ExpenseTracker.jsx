import { useState } from "react";

// ── Category config ──────────────────────────────────────────────
const CATEGORIES = ["Food", "Travel", "Utilities", "Entertainment", "Health", "Other"];

const CATEGORY_STYLES = {
  Food:          "bg-emerald-100 text-emerald-800",
  Travel:        "bg-blue-100 text-blue-800",
  Utilities:     "bg-amber-100 text-amber-800",
  Entertainment: "bg-purple-100 text-purple-800",
  Health:        "bg-red-100 text-red-800",
  Other:         "bg-gray-100 text-gray-700",
};

// ── Static sample data (so the list isn't empty on first load) ───
const SAMPLE_EXPENSES = [
  { id: 1, name: "Lunch at café",        amount: 320,  date: "2026-06-20", category: "Food" },
  { id: 2, name: "Metro card top-up",    amount: 200,  date: "2026-06-21", category: "Travel" },
  { id: 3, name: "Netflix subscription", amount: 649,  date: "2026-06-22", category: "Entertainment" },
];

// ── Helper ───────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatAmount(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function ExpenseTracker() {

  // ── 1. Form state (one useState per field) ───────────────────
  const [name,     setName]     = useState("");
  const [amount,   setAmount]   = useState("");
  const [date,     setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");

  // ── 2. Expenses list state ───────────────────────────────────
  const [expenses, setExpenses] = useState(SAMPLE_EXPENSES);

  // ── 3. Error state (simple validation) ──────────────────────
  const [error, setError] = useState("");

  // ── 4. Add expense handler ───────────────────────────────────
  function handleAddExpense(e) {
    e.preventDefault(); // prevent page reload

    // Basic validation
    if (!name.trim() || !amount || !date || !category) {
      setError("Please fill in all fields before adding.");
      return;
    }
    if (Number(amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    // Build new expense object
    const newExpense = {
      id:       Date.now(),          // unique id using timestamp
      name:     name.trim(),
      amount:   parseFloat(amount),
      date:     date,
      category: category,
    };

    // Prepend to list (newest first)
    setExpenses([newExpense, ...expenses]);

    // Reset form fields
    setName("");
    setAmount("");
    setCategory("");
    setError("");
  }

  // ── 5. Delete expense handler ────────────────────────────────
  function handleDelete(id) {
    setExpenses(expenses.filter((exp) => exp.id !== id));
  }

  // ── 6. Derived stats ─────────────────────────────────────────
  const total   = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const average = expenses.length ? total / expenses.length : 0;

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Expense Tracker</h1>
          <p className="text-gray-500 mt-1 text-sm">Log and track your daily spending</p>
        </div>

        {/* ── Summary cards ───────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total spent</p>
            <p className="text-2xl font-semibold text-gray-900">{formatAmount(total)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Expenses</p>
            <p className="text-2xl font-semibold text-gray-900">{expenses.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Average</p>
            <p className="text-2xl font-semibold text-gray-900">{formatAmount(Math.round(average))}</p>
          </div>
        </div>

        {/* ── Add Expense Form ─────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-base font-medium text-gray-800 mb-5">Add expense</h2>

          {/* HTML form — with onSubmit handler */}
          <form onSubmit={handleAddExpense} noValidate>

            {/* Expense name */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1" htmlFor="exp-name">
                Expense name
              </label>
              <input
                id="exp-name"
                type="text"
                placeholder="e.g. Lunch at café"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-gray-400"
              />
            </div>

            {/* Amount + Date — side by side */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="exp-amount">
                  Amount (₹)
                </label>
                <input
                  id="exp-amount"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="exp-date">
                  Date
                </label>
                <input
                  id="exp-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="block text-sm text-gray-600 mb-1" htmlFor="exp-category">
                Category
              </label>
              <select
                id="exp-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Validation error */}
            {error && (
              <p className="text-red-500 text-xs mb-4">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-medium text-sm py-2.5 rounded-lg transition-all duration-150"
            >
              + Add expense
            </button>
          </form>
        </div>

        {/* ── Expense List ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-800">Expenses</h2>
            {expenses.length > 0 && (
              <span className="text-xs text-gray-400">{expenses.length} item{expenses.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {/* Empty state */}
          {expenses.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-sm">No expenses yet. Add one above!</p>
            </div>
          ) : (
            <ul>
              {expenses.map((exp) => (
                <li
                  key={exp.id}
                  className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  {/* Category badge */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${CATEGORY_STYLES[exp.category] || CATEGORY_STYLES.Other}`}>
                    {exp.category}
                  </span>

                  {/* Name */}
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                    {exp.name}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDate(exp.date)}
                  </span>

                  {/* Amount */}
                  <span className="text-sm font-semibold text-gray-900 min-w-[70px] text-right shrink-0">
                    {formatAmount(exp.amount)}
                  </span>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none shrink-0"
                    aria-label={`Delete ${exp.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
