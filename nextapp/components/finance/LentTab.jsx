"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

const EMPTY_LENT = { personName: "", amount: "", lentAt: "", note: "" };

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

const inputCls = "w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted";

export default function LentTab() {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("outstanding");
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_LENT);

  const [repayOpenId, setRepayOpenId] = useState(null);
  const [repayData, setRepayData]     = useState({ amount: "", repaidAt: todayISO(), note: "" });

  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/finance/lent"); setRecords(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = records.reduce((acc, r) => {
    const key = r.personName.trim().toLowerCase();
    if (!acc[key]) acc[key] = { name: r.personName.trim(), records: [] };
    acc[key].records.push(r);
    return acc;
  }, {});

  const groups = Object.values(grouped).map((g) => {
    const totalLent   = g.records.reduce((s, r) => s + r.amount, 0);
    const totalRepaid = g.records.reduce((s, r) => s + r.repayments.reduce((rs, rp) => rs + rp.amount, 0), 0);
    const outstanding = totalLent - totalRepaid;
    const allSettled  = g.records.every((r) => r.status === "settled");
    return { ...g, totalLent, totalRepaid, outstanding, allSettled };
  }).sort((a, b) => b.outstanding - a.outstanding);

  const totalLent        = records.reduce((s, r) => s + r.amount, 0);
  const totalRepaid      = records.reduce((s, r) => s + r.repayments.reduce((rs, rp) => rs + rp.amount, 0), 0);
  const totalOutstanding = totalLent - totalRepaid;
  const settledCount     = groups.filter((g) => g.allSettled).length;

  const filteredGroups = groups.filter((g) => {
    if (filter === "outstanding") return !g.allSettled;
    if (filter === "settled")     return g.allSettled;
    return true;
  });

  function recordOutstanding(r) {
    return r.amount - r.repayments.reduce((s, rp) => s + rp.amount, 0);
  }

  function openAdd(prefillName = "") {
    setForm({ ...EMPTY_LENT, personName: prefillName, lentAt: todayISO() });
    setEditing(null);
    setShowForm(true);
  }

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
    if (!confirm("Delete this lending record and all its repayments?")) return;
    await api.delete(`/finance/lent/${id}`);
    load();
  }

  function openRepayForm(lentId) {
    setRepayOpenId(repayOpenId === lentId ? null : lentId);
    setRepayData({ amount: "", repaidAt: todayISO(), note: "" });
  }

  async function handleAddRepayment(e, lentId) {
    e.preventDefault();
    await api.post(`/finance/lent/${lentId}/repayments`, repayData);
    setRepayOpenId(null);
    load();
  }

  async function handleDeleteRepayment(lentId, rid) {
    await api.delete(`/finance/lent/${lentId}/repayments/${rid}`);
    load();
  }

  return (
    <div className="space-y-5">
      {/* Summary — 1 col mobile → 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Outstanding</p>
          <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{fmtINR(totalOutstanding)}</p>
          <p className="text-xs text-text-muted mt-0.5">{groups.filter((g) => !g.allSettled).length} people</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Lent</p>
          <p className="text-xl md:text-2xl font-bold text-text-primary mt-1">{fmtINR(totalLent)}</p>
          <p className="text-xs text-text-muted mt-0.5">{records.length} transactions</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Fully Recovered</p>
          <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fmtINR(totalRepaid)}</p>
          <p className="text-xs text-text-muted mt-0.5">{settledCount} people settled</p>
        </div>
      </div>

      {/* Header + filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-bg-elevated rounded-lg p-1 border border-border">
          {[["outstanding","Outstanding"],["settled","Settled"],["all","All"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filter === v ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"}`}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={() => openAdd()}
          className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
          + Lend Money
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm">
          <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Record" : "New Lending"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="sm:col-span-2 flex gap-3 justify-end">
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

      {/* Groups */}
      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-5xl mb-3">🤝</p>
          <p>{filter === "outstanding" ? "No outstanding amounts. Everyone paid you back!" : "No records yet. Click \"Lend Money\" to add one."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((g) => (
            <div key={g.name} className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              {/* Person header */}
              <div className="px-4 md:px-5 py-3.5 md:py-4 border-b border-border bg-bg-elevated/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{g.name}</p>
                    <p className="text-xs text-text-muted">{g.records.length} transaction{g.records.length > 1 ? "s" : ""} · Total lent {fmtINR(g.totalLent)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Remaining</p>
                    <p className={`text-base md:text-lg font-bold ${g.allSettled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {g.allSettled ? "Settled ✓" : fmtINR(g.outstanding)}
                    </p>
                  </div>
                  <button onClick={() => openAdd(g.name)}
                    className="text-xs bg-bg-elevated hover:bg-accent hover:text-white border border-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                    + Lend More
                  </button>
                </div>
              </div>

              {/* Individual lending records */}
              <div className="divide-y divide-border">
                {g.records.map((r) => {
                  const repaid  = r.repayments.reduce((s, rp) => s + rp.amount, 0);
                  const remain  = recordOutstanding(r);
                  const pct     = Math.min(100, Math.round((repaid / r.amount) * 100));
                  const settled = r.status === "settled";
                  const isExpanded = expandedId === r.id;

                  return (
                    <div key={r.id} className="px-4 md:px-5 py-3.5 md:py-4">
                      {/* Record row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-text-primary">{fmtINR(r.amount)}</span>
                            <span className="text-xs text-text-muted">lent {fmtDate(r.lentAt)}</span>
                            {r.note && <span className="text-xs text-text-muted">· {r.note}</span>}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${settled ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"}`}>
                              {settled ? "Settled" : `${fmtINR(remain)} left`}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2 h-1 bg-bg-elevated rounded-full overflow-hidden w-48">
                            <div className={`h-full rounded-full ${settled ? "bg-green-500" : "bg-accent"}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-text-muted mt-0.5">{fmtINR(repaid)} repaid ({pct}%)</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!settled && (
                            <button onClick={() => openRepayForm(r.id)}
                              className={`text-xs px-3 py-1 rounded-lg border transition-colors ${repayOpenId === r.id ? "bg-accent text-white border-accent" : "bg-bg-elevated hover:bg-accent/10 border-border text-accent"}`}>
                              + Repayment
                            </button>
                          )}
                          <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="text-xs text-text-muted hover:text-text-primary transition-colors">
                            {isExpanded ? "▲" : `▼ ${r.repayments.length}`}
                          </button>
                          <button onClick={() => openEdit(r)} className="text-xs text-text-muted hover:text-accent transition-colors">Edit</button>
                          <button onClick={() => handleDelete(r.id)} className="text-xs text-text-muted hover:text-red-500 transition-colors">✕</button>
                        </div>
                      </div>

                      {/* Repayment form */}
                      {repayOpenId === r.id && (
                        <form onSubmit={(e) => handleAddRepayment(e, r.id)}
                          className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-bg-elevated rounded-lg border border-border">
                          <div className="space-y-1">
                            <label className="text-xs text-text-secondary">Amount (₹)</label>
                            <input
                              required
                              type="number"
                              min="1"
                              step="0.01"
                              value={repayData.amount}
                              onChange={(e) => setRepayData((d) => ({ ...d, amount: e.target.value }))}
                              className={inputCls}
                              placeholder="0"
                              autoFocus
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-text-secondary">Date</label>
                            <input
                              type="date"
                              value={repayData.repaidAt}
                              onChange={(e) => setRepayData((d) => ({ ...d, repaidAt: e.target.value }))}
                              className={inputCls}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-text-secondary">Note</label>
                            <input
                              value={repayData.note}
                              onChange={(e) => setRepayData((d) => ({ ...d, note: e.target.value }))}
                              className={inputCls}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="sm:col-span-3 flex gap-2 justify-end">
                            <button type="button" onClick={() => setRepayOpenId(null)}
                              className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5">Cancel</button>
                            <button type="submit"
                              className="text-xs bg-accent hover:bg-accent/90 text-white px-4 py-1.5 rounded-lg transition-colors">
                              Record Repayment
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Repayment history */}
                      {isExpanded && (
                        <div className="mt-3 pl-2 border-l-2 border-border space-y-1.5">
                          {r.repayments.length === 0 ? (
                            <p className="text-xs text-text-muted">No repayments yet.</p>
                          ) : r.repayments.map((rp) => (
                            <div key={rp.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                <span className="text-xs text-text-muted">{fmtDate(rp.repaidAt)}</span>
                                {rp.note && <span className="text-xs text-text-muted">· {rp.note}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">+{fmtINR(rp.amount)}</span>
                                <button onClick={() => handleDeleteRepayment(r.id, rp.id)}
                                  className="text-text-muted hover:text-red-500 text-[10px] transition-colors">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
