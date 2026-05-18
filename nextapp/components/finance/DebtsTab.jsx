"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const EMPTY = { name: "", type: "loan", principal: "", interestRate: "", minimumPayment: "", dueDate: "", currency: "INR", notes: "" };
const TYPES = ["credit-card", "loan", "mortgage", "other"];
const TYPE_ICONS = { "credit-card": "💳", loan: "🏦", mortgage: "🏠", other: "📋" };

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function payoffMonths(principal, interestRate, minimumPayment) {
  if (!minimumPayment || minimumPayment <= 0) return null;
  const r = interestRate / 100 / 12;
  if (r === 0) return Math.ceil(principal / minimumPayment);
  const interest = principal * r;
  if (minimumPayment <= interest) return null;
  return Math.ceil(-Math.log(1 - interest / minimumPayment) / Math.log(1 + r));
}

function closeDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(months));
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default function DebtsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/finance/debts"); setItems(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const totalDebt = items.reduce((s, i) => s + i.principal, 0);
  const totalMinPayment = items.reduce((s, i) => s + (i.minimumPayment ?? 0), 0);
  const avgRate = items.length ? (items.reduce((s, i) => s + i.interestRate, 0) / items.length).toFixed(1) : null;

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(item) {
    setForm({
      ...item,
      principal: String(item.principal),
      interestRate: String(item.interestRate),
      minimumPayment: String(item.minimumPayment ?? ""),
      dueDate: item.dueDate?.slice(0, 10) ?? "",
    });
    setEditing(item.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      principal: parseFloat(form.principal),
      interestRate: parseFloat(form.interestRate),
      minimumPayment: form.minimumPayment ? parseFloat(form.minimumPayment) : null,
    };
    if (editing) await api.put(`/finance/debts/${editing}`, payload);
    else await api.post("/finance/debts", payload);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/finance/debts/${id}`);
    load();
  }

  return (
    <div className="space-y-5">
      {/* Summary — 1 col mobile → 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Debt</p>
          <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{fmt(totalDebt)}</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Min. Monthly Payment</p>
          <p className="text-2xl md:text-3xl font-bold text-text-primary mt-1">{fmt(totalMinPayment)}</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Avg. Interest Rate</p>
          <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{avgRate ? `${avgRate}%` : "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Debts</h2>
        <button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">+ Add Debt</button>
      </div>

      {showForm && (
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Debt" : "New Debt"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                placeholder="Visa, Student Loan…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Balance Owed</label>
              <input required type="number" min="0" step="0.01" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Interest Rate (%)</label>
              <input required type="number" min="0" step="0.01" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Minimum Payment</label>
              <input type="number" min="0" step="0.01" value={form.minimumPayment} onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs text-text-secondary">Notes</label>
              <input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                placeholder="Optional" />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
                {editing ? "Save changes" : "Add debt"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-text-muted"><p className="text-4xl mb-3">💳</p><p>No debts tracked. Add one to stay on top of it.</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-bg-surface border border-border rounded-xl px-4 md:px-5 py-3.5 md:py-4 flex items-center gap-3 md:gap-4 hover:border-border transition-colors shadow-sm">
              <span className="text-2xl">{TYPE_ICONS[item.type] ?? "📋"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary">{item.name}</p>
                <div className="flex flex-wrap gap-3 mt-0.5">
                  <span className="text-xs text-orange-600 dark:text-orange-400">{item.interestRate}% APR</span>
                  {item.minimumPayment && <span className="text-xs text-text-muted">EMI: {fmt(item.minimumPayment)}/mo</span>}
                  {item.dueDate && <span className="text-xs text-text-muted">Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                  {(() => {
                    const mo = payoffMonths(item.principal, item.interestRate, item.minimumPayment);
                    return mo ? <span className="text-xs text-green-600 dark:text-green-400">Closes {closeDate(mo)} ({mo}mo)</span> : null;
                  })()}
                </div>
                {item.notes && <p className="text-xs text-text-muted mt-0.5">{item.notes}</p>}
              </div>
              <span className="text-red-600 dark:text-red-400 font-semibold text-lg whitespace-nowrap">{fmt(item.principal)}</span>
              <div className="flex flex-col md:flex-row gap-1 md:gap-2 flex-shrink-0 items-end">
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
