"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

const EMPTY_LENT = { personName: "", amount: "", lentAt: "", note: "" };
const EMPTY_REPAYMENT = { amount: "", repaidAt: "", note: "" };

function fmtINR(n) {
  return "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function LentTab() {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("outstanding"); // "all" | "outstanding" | "settled"
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_LENT);
  const [expandedId, setExpandedId] = useState(null);
  const [repayForm, setRepayForm]   = useState(null); // lentId or null

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/finance/lent"); setRecords(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived stats
  const totalLent        = records.reduce((s, r) => s + r.amount, 0);
  const totalRepaid      = records.reduce((s, r) => s + r.repayments.reduce((rs, rp) => rs + rp.amount, 0), 0);
  const totalOutstanding = totalLent - totalRepaid;
  const settledCount     = records.filter((r) => r.status === "settled").length;

  const filtered = records.filter((r) => {
    if (filter === "outstanding") return r.status === "active";
    if (filter === "settled")     return r.status === "settled";
    return true;
  });

  function outstanding(r) {
    return r.amount - r.repayments.reduce((s, rp) => s + rp.amount, 0);
  }

  function openAdd() { setForm({ ...EMPTY_LENT, lentAt: todayISO() }); setEditing(null); setShowForm(true); }
  function openEdit(r) {
    setForm({ personName: r.personName, amount: String(r.amount), lentAt: r.lentAt?.slice(0, 10) ?? "", note: r.note ?? "" });
    setEditing(r.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) await api.put(`/finance/lent/${editing}`, form);
    else         await api.post("/finance/lent", form);
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this record and all its repayments?")) return;
    await api.delete(`/finance/lent/${id}`);
    load();
  }

  async function handleAddRepayment(e, lentId) {
    e.preventDefault();
    await api.post(`/finance/lent/${lentId}/repayments`, repayForm);
    setRepayForm(null);
    load();
  }

  async function handleDeleteRepayment(lentId, rid) {
    await api.delete(`/finance/lent/${lentId}/repayments/${rid}`);
    load();
  }

  const inputCls = "w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted";

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{fmtINR(totalOutstanding)}</p>
          <p className="text-xs text-text-muted mt-0.5">{records.filter((r) => r.status === "active").length} active</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Lent</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{fmtINR(totalLent)}</p>
          <p className="text-xs text-text-muted mt-0.5">{records.length} records</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Fully Recovered</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fmtINR(totalRepaid)}</p>
          <p className="text-xs text-text-muted mt-0.5">{settledCount} settled</p>
        </div>
      </div>

      {/* Header + filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-bg-elevated rounded-lg p-1 border border-border">
          {[["outstanding","Outstanding"],["settled","Settled"],["all","All"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filter === v ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"}`}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={openAdd}
          className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + Lend Money
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Record" : "New Lending"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Person Name</label>
              <input required value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })}
                className={inputCls} placeholder="Friend's name" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Amount (₹)</label>
              <input required type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={inputCls} placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Date Lent</label>
              <input type="date" value={form.lentAt} onChange={(e) => setForm({ ...form, lentAt: e.target.value })}
                className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Note (optional)</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                className={inputCls} placeholder="Purpose, occasion…" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
              <button type="submit"
                className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
                {editing ? "Save changes" : "Add record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record list */}
      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-5xl mb-3">🤝</p>
          <p>{filter === "outstanding" ? "No outstanding amounts. Everyone paid you back!" : "No records yet. Click \"Lend Money\" to add one."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => outstanding(b) - outstanding(a))
            .map((r) => {
              const repaid = r.repayments.reduce((s, rp) => s + rp.amount, 0);
              const remain = r.amount - repaid;
              const pct    = Math.min(100, Math.round((repaid / r.amount) * 100));
              const settled = r.status === "settled";
              const isExpanded = expandedId === r.id;

              return (
                <div key={r.id} className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-text-primary text-lg">{r.personName}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${settled ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"}`}>
                            {settled ? "Settled" : "Outstanding"}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          Lent on {fmtDate(r.lentAt)}
                          {r.note && <span> · {r.note}</span>}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => openEdit(r)} className="text-xs text-text-muted hover:text-accent transition-colors">Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="text-xs text-text-muted hover:text-red-500 transition-colors">Delete</button>
                      </div>
                    </div>

                    {/* Amounts row */}
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-xs text-text-muted">Lent</p>
                        <p className="text-base font-semibold text-text-primary">{fmtINR(r.amount)}</p>
                      </div>
                      <div className="text-text-muted text-sm">→</div>
                      <div>
                        <p className="text-xs text-text-muted">Repaid</p>
                        <p className="text-base font-semibold text-green-600 dark:text-green-400">{fmtINR(repaid)}</p>
                      </div>
                      <div className="text-text-muted text-sm">→</div>
                      <div>
                        <p className="text-xs text-text-muted">Remaining</p>
                        <p className={`text-base font-bold ${settled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {settled ? "Cleared" : fmtINR(remain)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${settled ? "bg-green-500" : "bg-accent"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-text-muted mt-1">{pct}% repaid</p>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      {!settled && (
                        <button onClick={() => setRepayForm(repayForm === r.id ? null : r.id)}
                          className="text-xs bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 px-3 py-1.5 rounded-lg transition-colors">
                          + Add Repayment
                        </button>
                      )}
                      <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        className="text-xs bg-bg-elevated hover:bg-border text-text-secondary border border-border px-3 py-1.5 rounded-lg transition-colors">
                        {isExpanded ? "Hide history" : `History (${r.repayments.length})`}
                      </button>
                    </div>

                    {/* Inline repayment form */}
                    {repayForm === r.id && (
                      <form onSubmit={(e) => handleAddRepayment(e, r.id)}
                        className="mt-3 grid grid-cols-3 gap-3 p-3 bg-bg-elevated rounded-lg border border-border">
                        <div className="space-y-1">
                          <label className="text-xs text-text-secondary">Amount (₹)</label>
                          <input required type="number" min="1" step="0.01"
                            value={repayForm?.amount ?? ""}
                            onChange={(e) => setRepayForm((prev) => ({ ...EMPTY_REPAYMENT, ...prev, amount: e.target.value }))}
                            className={inputCls} placeholder="0" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-text-secondary">Date</label>
                          <input type="date"
                            value={repayForm?.repaidAt ?? todayISO()}
                            onChange={(e) => setRepayForm((prev) => ({ ...EMPTY_REPAYMENT, ...prev, repaidAt: e.target.value }))}
                            className={inputCls} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-text-secondary">Note</label>
                          <input value={repayForm?.note ?? ""}
                            onChange={(e) => setRepayForm((prev) => ({ ...EMPTY_REPAYMENT, ...prev, note: e.target.value }))}
                            className={inputCls} placeholder="Optional" />
                        </div>
                        <div className="col-span-3 flex gap-2 justify-end">
                          <button type="button" onClick={() => setRepayForm(null)}
                            className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5">Cancel</button>
                          <button type="submit"
                            className="text-xs bg-accent hover:bg-accent/90 text-white px-4 py-1.5 rounded-lg transition-colors">
                            Record Repayment
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Repayment history */}
                  {isExpanded && (
                    <div className="border-t border-border bg-bg-elevated/40 px-5 py-3">
                      {r.repayments.length === 0 ? (
                        <p className="text-xs text-text-muted">No repayments recorded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Repayment History</p>
                          {r.repayments.map((rp) => (
                            <div key={rp.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                <span className="text-xs text-text-muted">{fmtDate(rp.repaidAt)}</span>
                                {rp.note && <span className="text-xs text-text-muted">· {rp.note}</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">+{fmtINR(rp.amount)}</span>
                                <button onClick={() => handleDeleteRepayment(r.id, rp.id)}
                                  className="text-text-muted hover:text-red-500 text-xs transition-colors">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
