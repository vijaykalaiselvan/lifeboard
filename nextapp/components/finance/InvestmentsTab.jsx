"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const EMPTY = { name: "", type: "stocks", currentValue: "", costBasis: "", currency: "USD", notes: "" };
const TYPES = ["stocks", "crypto", "real-estate", "bonds", "other"];
const TYPE_ICONS = { stocks: "📈", crypto: "₿", "real-estate": "🏠", bonds: "📄", other: "💼" };

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export default function InvestmentsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/finance/investments"); setItems(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const totalValue = items.reduce((s, i) => s + i.currentValue, 0);
  const totalCost = items.reduce((s, i) => s + i.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(1) : null;

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(item) {
    setForm({ ...item, currentValue: String(item.currentValue), costBasis: String(item.costBasis) });
    setEditing(item.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, currentValue: parseFloat(form.currentValue), costBasis: parseFloat(form.costBasis) };
    if (editing) await api.put(`/finance/investments/${editing}`, payload);
    else await api.post("/finance/investments", payload);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/finance/investments/${id}`);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Portfolio Value</p>
          <p className="text-3xl font-bold text-accent mt-1">{fmt(totalValue)}</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Invested</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{fmt(totalCost)}</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Gain / Loss</p>
          <p className={`text-3xl font-bold mt-1 ${totalGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {totalGain >= 0 ? "+" : ""}{fmt(totalGain)}
          </p>
          {gainPct && <p className={`text-xs mt-0.5 ${totalGain >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>{totalGain >= 0 ? "+" : ""}{gainPct}%</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Investments</h2>
        <button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ Add Investment</button>
      </div>

      {showForm && (
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Investment" : "New Investment"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                placeholder="Apple, Bitcoin, House…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Current Value</label>
              <input required type="number" min="0" step="0.01" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Cost Basis</label>
              <input required type="number" min="0" step="0.01" value={form.costBasis} onChange={(e) => setForm({ ...form, costBasis: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Currency</label>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Notes</label>
              <input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                placeholder="Optional" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
                {editing ? "Save changes" : "Add investment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-text-muted"><p className="text-4xl mb-3">📈</p><p>No investments yet. Add your portfolio.</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const gain = item.currentValue - item.costBasis;
            const pct = item.costBasis > 0 ? ((gain / item.costBasis) * 100).toFixed(1) : null;
            return (
              <div key={item.id} className="bg-bg-surface border border-border rounded-xl px-5 py-4 flex items-center gap-4 hover:border-border transition-colors shadow-sm">
                <span className="text-2xl">{TYPE_ICONS[item.type] ?? "💼"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">{item.name}</p>
                  <p className="text-xs text-text-muted">Cost: {fmt(item.costBasis, item.currency)}</p>
                  {item.notes && <p className="text-xs text-text-muted">{item.notes}</p>}
                </div>
                {pct && (
                  <span className={`text-xs px-2 py-1 rounded-full ${gain >= 0 ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"}`}>
                    {gain >= 0 ? "+" : ""}{pct}%
                  </span>
                )}
                <span className="text-accent font-semibold text-lg">{fmt(item.currentValue, item.currency)}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-text-muted hover:text-accent text-sm transition-colors">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-text-muted hover:text-red-500 text-sm transition-colors">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
