"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const EMPTY = { category: "", description: "", amount: "", currency: "USD", spentAt: "", note: "" };
const CATEGORIES = ["Housing", "Food", "Transport", "Health", "Entertainment", "Shopping", "Education", "Utilities", "Other"];
const CATEGORY_COLORS = {
  Housing:       "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Food:          "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  Transport:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  Health:        "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  Entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  Shopping:      "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  Education:     "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  Utilities:     "bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-300",
  Other:         "bg-slate-100 text-slate-500 dark:bg-gray-600/20 dark:text-gray-400",
};

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export default function ExpensesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/finance/expenses"); setItems(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const total = items.reduce((s, i) => s + i.amount, 0);
  const byCategory = items.reduce((acc, i) => { acc[i.category] = (acc[i.category] ?? 0) + i.amount; return acc; }, {});
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(item) {
    setForm({ ...item, amount: String(item.amount), spentAt: item.spentAt?.slice(0, 10) ?? "" });
    setEditing(item.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (editing) await api.put(`/finance/expenses/${editing}`, payload);
    else await api.post("/finance/expenses", payload);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/finance/expenses/${id}`);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Spent</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{fmt(total)}</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Transactions</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{items.length}</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Top Category</p>
          <p className="text-xl font-bold text-text-primary mt-1">{topCategory ? topCategory[0] : "—"}</p>
          {topCategory && <p className="text-xs text-text-muted">{fmt(topCategory[1])}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Expenses</h2>
        <button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ Add Expense</button>
      </div>

      {showForm && (
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Expense" : "New Expense"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Category</label>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
                <option value="">Select…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Description</label>
              <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                placeholder="Netflix, Groceries…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Amount</label>
              <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Date</label>
              <input type="date" value={form.spentAt} onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-text-secondary">Note</label>
              <input value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                placeholder="Optional note" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
                {editing ? "Save changes" : "Add expense"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-text-muted"><p className="text-4xl mb-3">🧾</p><p>No expenses yet. Track your first one.</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-bg-surface border border-border rounded-xl px-5 py-4 flex items-center gap-4 hover:border-border transition-colors shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary">{item.description}</p>
                {item.note && <p className="text-xs text-text-muted mt-0.5">{item.note}</p>}
                {item.spentAt && <p className="text-xs text-text-muted mt-0.5">{new Date(item.spentAt).toLocaleDateString()}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${CATEGORY_COLORS[item.category] ?? "bg-bg-elevated text-text-secondary"}`}>{item.category}</span>
              <span className="text-red-600 dark:text-red-400 font-semibold text-lg">{fmt(item.amount, item.currency)}</span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="text-text-muted hover:text-accent text-sm transition-colors">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-text-muted hover:text-red-500 text-sm transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
