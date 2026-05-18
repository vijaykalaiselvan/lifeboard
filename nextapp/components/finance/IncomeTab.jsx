"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const EMPTY = { source: "", amount: "", currency: "INR", frequency: "monthly", receivedAt: "", note: "" };
const FREQ_LABELS = { monthly: "Monthly", yearly: "Yearly", "one-time": "One-time" };

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

export default function IncomeTab() {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);

  const [selectedMonth, setSelectedMonth] = useState(currentYM);
  const [bankTxns, setBankTxns]           = useState([]);
  const [bankLoading, setBankLoading]     = useState(false);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/finance/income"); setItems(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setBankLoading(true);
    const { from, to } = monthRange(selectedMonth);
    api.get(`/finance/transactions?type=credit&from=${from}&to=${to}&limit=500`)
      .then(({ data }) => setBankTxns(data.transactions ?? []))
      .catch(() => setBankTxns([]))
      .finally(() => setBankLoading(false));
  }, [selectedMonth]);

  const manualTotal = items.reduce((s, i) => s + i.amount, 0);
  const bankTotal   = bankTxns.reduce((s, t) => s + t.amount, 0);

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(item) {
    setForm({ ...item, amount: String(item.amount), receivedAt: item.receivedAt?.slice(0, 10) ?? "" });
    setEditing(item.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (editing) await api.put(`/finance/income/${editing}`, payload);
    else await api.post("/finance/income", payload);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/finance/income/${id}`);
    load();
  }

  return (
    <div className="space-y-5">
      {/* Summary — 1 col mobile → 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Manual Sources</p>
          <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fmtINR(manualTotal)}</p>
          <p className="text-xs text-text-muted mt-0.5">{items.length} entries</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Bank Credits</p>
          <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fmtINR(bankTotal)}</p>
          <p className="text-xs text-text-muted mt-0.5">{bankTxns.length} transactions</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Combined</p>
          <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fmtINR(manualTotal + bankTotal)}</p>
        </div>
      </div>

      {/* Manual Income */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Manual Income Sources</h2>
        <button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
          + Add Income
        </button>
      </div>

      {showForm && (
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Income" : "New Income"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs text-text-secondary">Source</label>
              <input required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                placeholder="Salary, Freelance, Rental…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Amount (₹)</label>
              <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Date received</label>
              <input type="date" value={form.receivedAt} onChange={(e) => setForm({ ...form, receivedAt: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Note</label>
              <input value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                placeholder="Optional note" />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
                {editing ? "Save changes" : "Add income"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          <p className="text-4xl mb-3">💵</p>
          <p>No manual income sources. Add a recurring salary or income entry above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-bg-surface border border-border rounded-xl px-4 md:px-5 py-3.5 md:py-4 flex items-center gap-3 md:gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary">{item.source}</p>
                {item.note && <p className="text-xs text-text-muted mt-0.5">{item.note}</p>}
              </div>
              <span className="text-xs text-text-secondary bg-bg-elevated px-2 py-1 rounded-full border border-border flex-shrink-0">
                {FREQ_LABELS[item.frequency]}
              </span>
              <span className="text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">{fmtINR(item.amount)}</span>
              <div className="flex flex-col md:flex-row gap-1 md:gap-2 flex-shrink-0 items-end">
                <button onClick={() => openEdit(item)} className="text-text-muted hover:text-accent text-sm transition-colors">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-text-muted hover:text-red-500 text-sm transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bank Credits */}
      <div className="flex items-center justify-between gap-3 mt-2">
        <h2 className="text-lg font-semibold text-text-primary">Bank Credits</h2>
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-accent" />
      </div>

      {bankLoading ? (
        <p className="text-text-muted text-sm">Loading bank transactions…</p>
      ) : bankTxns.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          <p className="text-4xl mb-3">🏦</p>
          <p>No credits found for this month. Import a bank statement in the Accounts tab.</p>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-elevated">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Description</th>
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
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: txn.account?.color || "#7c3aed" }} />
                        <span className="text-xs text-text-muted">{txn.account?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                      +{fmtINR(txn.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-bg-elevated">
                  <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Credits</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">{fmtINR(bankTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-border">
            {bankTxns.map((txn) => (
              <div key={txn.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-sm text-text-primary truncate">{txn.description}</p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                    +{fmtINR(txn.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{new Date(txn.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: txn.account?.color || "#7c3aed" }} />
                    <span>{txn.account?.name}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 bg-bg-elevated">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Credits</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{fmtINR(bankTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
