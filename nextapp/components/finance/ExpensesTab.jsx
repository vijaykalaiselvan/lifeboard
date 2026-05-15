"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const EMPTY = { category: "", description: "", amount: "", currency: "USD", spentAt: "", note: "" };
const CATEGORIES = ["Housing", "Food", "Transport", "Health", "Entertainment", "Shopping", "Education", "Utilities", "Other"];
const CATEGORY_COLORS = {
  Housing: "bg-blue-500/20 text-blue-300", Food: "bg-orange-500/20 text-orange-300",
  Transport: "bg-yellow-500/20 text-yellow-300", Health: "bg-green-500/20 text-green-300",
  Entertainment: "bg-purple-500/20 text-purple-300", Shopping: "bg-pink-500/20 text-pink-300",
  Education: "bg-cyan-500/20 text-cyan-300", Utilities: "bg-gray-500/20 text-gray-300",
  Other: "bg-gray-600/20 text-gray-400",
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Spent</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{fmt(total)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Transactions</p>
          <p className="text-3xl font-bold text-white mt-1">{items.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Top Category</p>
          <p className="text-xl font-bold text-white mt-1">{topCategory ? topCategory[0] : "—"}</p>
          {topCategory && <p className="text-xs text-gray-500">{fmt(topCategory[1])}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Expenses</h2>
        <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ Add Expense</button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">{editing ? "Edit Expense" : "New Expense"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Category</label>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Select…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Description</label>
              <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Netflix, Groceries…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Amount</label>
              <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Date</label>
              <input type="date" value={form.spentAt} onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-gray-400">Note</label>
              <input value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Optional note" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                {editing ? "Save changes" : "Add expense"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-600"><p className="text-4xl mb-3">🧾</p><p>No expenses yet. Track your first one.</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-gray-700 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{item.description}</p>
                {item.note && <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>}
                {item.spentAt && <p className="text-xs text-gray-600 mt-0.5">{new Date(item.spentAt).toLocaleDateString()}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${CATEGORY_COLORS[item.category] ?? "bg-gray-700 text-gray-300"}`}>{item.category}</span>
              <span className="text-red-400 font-semibold text-lg">{fmt(item.amount, item.currency)}</span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="text-gray-500 hover:text-indigo-400 text-sm transition-colors">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-400 text-sm transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
