import { useState, useEffect } from "react";
import api from "../../api/client";

const EMPTY = { name: "", type: "loan", principal: "", interestRate: "", minimumPayment: "", dueDate: "", currency: "USD", notes: "" };
const TYPES = ["credit-card", "loan", "mortgage", "other"];
const TYPE_ICONS = { "credit-card": "💳", loan: "🏦", mortgage: "🏠", other: "📋" };

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
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
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Debt</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{fmt(totalDebt)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Min. Monthly Payment</p>
          <p className="text-3xl font-bold text-white mt-1">{fmt(totalMinPayment)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Avg. Interest Rate</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">{avgRate ? `${avgRate}%` : "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Debts</h2>
        <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + Add Debt
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">{editing ? "Edit Debt" : "New Debt"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Visa, Student Loan…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Balance Owed</label>
              <input required type="number" min="0" step="0.01" value={form.principal}
                onChange={(e) => setForm({ ...form, principal: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Interest Rate (%)</label>
              <input required type="number" min="0" step="0.01" value={form.interestRate}
                onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Minimum Payment</label>
              <input type="number" min="0" step="0.01" value={form.minimumPayment}
                onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-gray-400">Notes</label>
              <input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Optional" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                {editing ? "Save changes" : "Add debt"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-4xl mb-3">💳</p>
          <p>No debts tracked. Add one to stay on top of it.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-gray-700 transition-colors">
              <span className="text-2xl">{TYPE_ICONS[item.type] ?? "📋"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{item.name}</p>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-xs text-orange-400">{item.interestRate}% APR</span>
                  {item.minimumPayment && <span className="text-xs text-gray-500">Min: {fmt(item.minimumPayment, item.currency)}/mo</span>}
                  {item.dueDate && <span className="text-xs text-gray-500">Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                </div>
                {item.notes && <p className="text-xs text-gray-600 mt-0.5">{item.notes}</p>}
              </div>
              <span className="text-red-400 font-semibold text-lg">{fmt(item.principal, item.currency)}</span>
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
