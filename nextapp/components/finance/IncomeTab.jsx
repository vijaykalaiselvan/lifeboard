"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const EMPTY = { source: "", amount: "", currency: "USD", frequency: "monthly", receivedAt: "", note: "" };
const FREQ_LABELS = { monthly: "Monthly", yearly: "Yearly", "one-time": "One-time" };

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export default function IncomeTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/finance/income"); setItems(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const total = items.reduce((s, i) => s + i.amount, 0);

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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Income</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{fmt(total)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Sources</p>
          <p className="text-3xl font-bold text-white mt-1">{items.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Income Sources</h2>
        <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ Add Income</button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">{editing ? "Edit Income" : "New Income"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-gray-400">Source</label>
              <input required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Salary, Freelance, Rental…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Amount</label>
              <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Currency</label>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Date received</label>
              <input type="date" value={form.receivedAt} onChange={(e) => setForm({ ...form, receivedAt: e.target.value })}
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
                {editing ? "Save changes" : "Add income"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-600"><p className="text-4xl mb-3">💵</p><p>No income sources yet. Add your first one.</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-gray-700 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{item.source}</p>
                {item.note && <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>}
              </div>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{FREQ_LABELS[item.frequency]}</span>
              <span className="text-green-400 font-semibold text-lg">{fmt(item.amount, item.currency)}</span>
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
