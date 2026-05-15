import { useState, useEffect } from "react";
import api from "../../api/client";

const EMPTY = { name: "", type: "stocks", currentValue: "", costBasis: "", currency: "USD", notes: "" };
const TYPES = ["stocks", "crypto", "real-estate", "bonds", "other"];

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

const TYPE_ICONS = { stocks: "📈", crypto: "₿", "real-estate": "🏠", bonds: "📄", other: "💼" };

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
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Portfolio Value</p>
          <p className="text-3xl font-bold text-indigo-400 mt-1">{fmt(totalValue)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Invested</p>
          <p className="text-3xl font-bold text-white mt-1">{fmt(totalCost)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Gain / Loss</p>
          <p className={`text-3xl font-bold mt-1 ${totalGain >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalGain >= 0 ? "+" : ""}{fmt(totalGain)}
          </p>
          {gainPct && <p className={`text-xs mt-0.5 ${totalGain >= 0 ? "text-green-500" : "text-red-500"}`}>{totalGain >= 0 ? "+" : ""}{gainPct}%</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Investments</h2>
        <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + Add Investment
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">{editing ? "Edit Investment" : "New Investment"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Apple, Bitcoin, House…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Current Value</label>
              <input required type="number" min="0" step="0.01" value={form.currentValue}
                onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Cost Basis (amount paid)</label>
              <input required type="number" min="0" step="0.01" value={form.costBasis}
                onChange={(e) => setForm({ ...form, costBasis: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Currency</label>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Notes</label>
              <input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Optional" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                {editing ? "Save changes" : "Add investment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-4xl mb-3">📈</p>
          <p>No investments yet. Add your portfolio.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const gain = item.currentValue - item.costBasis;
            const pct = item.costBasis > 0 ? ((gain / item.costBasis) * 100).toFixed(1) : null;
            return (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-gray-700 transition-colors">
                <span className="text-2xl">{TYPE_ICONS[item.type] ?? "💼"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">Cost: {fmt(item.costBasis, item.currency)}</p>
                  {item.notes && <p className="text-xs text-gray-600">{item.notes}</p>}
                </div>
                {pct && (
                  <span className={`text-xs px-2 py-1 rounded-full ${gain >= 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                    {gain >= 0 ? "+" : ""}{pct}%
                  </span>
                )}
                <span className="text-indigo-400 font-semibold text-lg">{fmt(item.currentValue, item.currency)}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-gray-500 hover:text-indigo-400 text-sm transition-colors">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-400 text-sm transition-colors">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
