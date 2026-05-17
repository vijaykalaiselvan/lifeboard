"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const EMPTY = { category: "", description: "", amount: "", currency: "INR", spentAt: "", note: "" };
const CATEGORIES = ["Housing", "Food", "Transport", "Health", "Entertainment", "Shopping", "Education", "Utilities", "Other"];
const CAT_COLORS = {
  Housing:       "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  Food:          "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  Transport:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  Health:        "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  Entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  Shopping:      "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  Education:     "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  Utilities:     "bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-300",
  Debt:          "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Other:         "bg-slate-100 text-slate-500 dark:bg-gray-600/20 dark:text-gray-400",
};

function fmtINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function monthRange(ym) {
  const [y, m] = ym.split("-").map(Number);
  const from = `${ym}-01`;
  const to   = `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
  return { from, to };
}

function currentYM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ExpensesTab() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);

  const [selectedMonth, setSelectedMonth] = useState(currentYM);
  const [bankTxns, setBankTxns]           = useState([]);
  const [bankLoading, setBankLoading]     = useState(false);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/finance/expenses"); setItems(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setBankLoading(true);
    const { from, to } = monthRange(selectedMonth);
    // Fetch debits; exclude Income/Debt categories (those aren't spending)
    api.get(`/finance/transactions?type=debit&from=${from}&to=${to}&limit=500`)
      .then(({ data }) => setBankTxns(data.transactions ?? []))
      .catch(() => setBankTxns([]))
      .finally(() => setBankLoading(false));
  }, [selectedMonth]);

  const manualTotal = items.reduce((s, i) => s + i.amount, 0);
  const bankTotal   = bankTxns.reduce((s, t) => s + t.amount, 0);

  // Group bank debits by category
  const bankByCategory = bankTxns.reduce((acc, t) => {
    const cat = t.category || "Other";
    acc[cat] = (acc[cat] ?? 0) + t.amount;
    return acc;
  }, {});
  const bankCatSorted = Object.entries(bankByCategory).sort((a, b) => b[1] - a[1]);

  const manualByCategory = items.reduce((acc, i) => { acc[i.category] = (acc[i.category] ?? 0) + i.amount; return acc; }, {});
  const topManualCat = Object.entries(manualByCategory).sort((a, b) => b[1] - a[1])[0];

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
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Manual Expenses</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{fmtINR(manualTotal)}</p>
          <p className="text-xs text-text-muted mt-0.5">{items.length} entries</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Bank Debits</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{fmtINR(bankTotal)}</p>
          <p className="text-xs text-text-muted mt-0.5">{bankTxns.length} transactions</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Top Category</p>
          <p className="text-xl font-bold text-text-primary mt-1">
            {bankCatSorted[0]?.[0] ?? topManualCat?.[0] ?? "—"}
          </p>
          {(bankCatSorted[0] || topManualCat) && (
            <p className="text-xs text-text-muted">{fmtINR(bankCatSorted[0]?.[1] ?? topManualCat?.[1] ?? 0)}</p>
          )}
        </div>
      </div>

      {/* Manual Expenses */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Manual Expenses</h2>
        <button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + Add Expense
        </button>
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
              <label className="text-xs text-text-secondary">Amount (₹)</label>
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
        <div className="text-center py-8 text-text-muted">
          <p className="text-4xl mb-3">🧾</p>
          <p>No manual expenses. Add a recurring or one-off expense above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-bg-surface border border-border rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary">{item.description}</p>
                {item.note && <p className="text-xs text-text-muted mt-0.5">{item.note}</p>}
                {item.spentAt && <p className="text-xs text-text-muted mt-0.5">{new Date(item.spentAt).toLocaleDateString("en-IN")}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${CAT_COLORS[item.category] ?? "bg-bg-elevated text-text-secondary"}`}>{item.category}</span>
              <span className="text-red-600 dark:text-red-400 font-semibold">{fmtINR(item.amount)}</span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="text-text-muted hover:text-accent text-sm transition-colors">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-text-muted hover:text-red-500 text-sm transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bank Debits */}
      <div className="flex items-center justify-between mt-2">
        <h2 className="text-lg font-semibold text-text-primary">Bank Debits</h2>
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-accent" />
      </div>

      {bankLoading ? (
        <p className="text-text-muted text-sm">Loading bank transactions…</p>
      ) : bankTxns.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          <p className="text-4xl mb-3">🏦</p>
          <p>No debits found for this month. Import a bank statement in the Accounts tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Category breakdown */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">By Category</p>
            <div className="space-y-2">
              {bankCatSorted.map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full w-24 text-center flex-shrink-0 ${CAT_COLORS[cat] ?? "bg-bg-elevated text-text-secondary"}`}>{cat}</span>
                  <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-accent/60 rounded-full" style={{ width: `${(amt / bankTotal) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-text-primary w-24 text-right flex-shrink-0">{fmtINR(amt)}</span>
                  <span className="text-xs text-text-muted w-10 text-right flex-shrink-0">{((amt / bankTotal) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction list */}
          <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-elevated">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Account</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bankTxns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {new Date(txn.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-text-primary max-w-xs truncate">{txn.description}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CAT_COLORS[txn.category] ?? "bg-bg-elevated text-text-secondary"}`}>
                        {txn.category || "Other"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: txn.account?.color || "#6366f1" }} />
                        <span className="text-xs text-text-muted">{txn.account?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                      −{fmtINR(txn.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-bg-elevated">
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Debits</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">{fmtINR(bankTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
