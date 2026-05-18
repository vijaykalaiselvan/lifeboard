"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { parseTransactions } from "@/lib/csvParsers";

const BANKS = ["HDFC", "SBI", "Axis", "BOB", "ICICI", "Other"];
const ACCOUNT_TYPES = [
  { value: "savings",     label: "Savings Account" },
  { value: "current",     label: "Current Account" },
  { value: "credit-card", label: "Credit Card" },
];
const COLORS = ["#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#06b6d4"];
const BANK_ICONS = { HDFC: "🏦", SBI: "🏛️", Axis: "🔵", BOB: "🟠", ICICI: "💎", Other: "🏦" };

const EMPTY = { name: "", bankName: "HDFC", accountType: "savings", lastFourDigits: "", currency: "INR", color: COLORS[0] };

function fmtDate(d) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  // Import state
  const [importingId, setImportingId] = useState(null);
  const [importPreview, setImportPreview] = useState(null); // { format, transactions, accountId }
  const [importStatus, setImportStatus] = useState(null);  // { inserted, skipped } or { error }
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/finance/accounts"); setAccounts(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(acc) {
    setForm({ name: acc.name, bankName: acc.bankName, accountType: acc.accountType, lastFourDigits: acc.lastFourDigits ?? "", currency: acc.currency, color: acc.color ?? COLORS[0] });
    setEditing(acc.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) await api.put(`/finance/accounts/${editing}`, form);
    else await api.post("/finance/accounts", form);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this account and ALL its transactions?")) return;
    await api.delete(`/finance/accounts/${id}`);
    load();
  }

  function startImport(acc) {
    setImportingId(acc.id);
    setImportPreview(null);
    setImportStatus(null);
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const acc = accounts.find((a) => a.id === importingId);
    if (!acc) return;

    const text = await file.text();
    const { format, transactions } = await parseTransactions(text, acc.id);
    setImportPreview({ format, transactions, accountId: acc.id, accountName: acc.name });
  }

  async function confirmImport() {
    if (!importPreview) return;
    setImporting(true);
    try {
      const { data } = await api.post(`/finance/accounts/${importPreview.accountId}/import`, {
        transactions: importPreview.transactions,
      });
      setImportStatus(data);
      setImportPreview(null);
      load();
    } catch {
      setImportStatus({ error: "Import failed. Please try again." });
    } finally {
      setImporting(false);
    }
  }

  function cancelImport() {
    setImportingId(null);
    setImportPreview(null);
    setImportStatus(null);
  }

  const TYPE_BADGE = {
    "savings":     "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    "current":     "bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400",
    "credit-card": "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  };

  return (
    <div className="space-y-5">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Bank Accounts & Cards</h2>
          <p className="text-xs text-text-muted mt-0.5">Add your accounts once, then import CSV statements anytime.</p>
        </div>
        <button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + Add Account
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Account" : "New Account"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Account Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                placeholder="HDFC Salary, Axis Credit Card…" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Bank</label>
              <select value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
                {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Account Type</label>
              <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
                {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Last 4 Digits</label>
              <input value={form.lastFourDigits} onChange={(e) => setForm({ ...form, lastFourDigits: e.target.value.slice(0, 4) })}
                maxLength={4} pattern="[0-9]{4}"
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
                placeholder="1234 (optional)" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-text-secondary">Color</label>
              <div className="flex gap-2 mt-1">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-text-primary scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
                {editing ? "Save changes" : "Add account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import preview */}
      {importPreview && (
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Import Preview — {importPreview.accountName}</p>
              <p className="text-xs text-text-muted mt-0.5">
                Detected format: <span className="font-medium text-text-secondary">{importPreview.format}</span> ·{" "}
                <span className="font-medium text-accent">{importPreview.transactions.length} transactions</span> found
              </p>
            </div>
            <button onClick={cancelImport} className="text-xs text-text-muted hover:text-text-primary">Cancel</button>
          </div>
          {importPreview.transactions.length === 0 ? (
            <p className="text-sm text-red-500">No transactions parsed. The CSV format may not be supported — try saving as CSV from Excel first.</p>
          ) : (
            <>
              <div className="border border-border rounded-lg overflow-x-auto mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bg-elevated border-b border-border">
                      {["Date", "Description", "Type", "Amount", "Category"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-text-muted font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {importPreview.transactions.slice(0, 10).map((t, i) => (
                      <tr key={i} className="hover:bg-bg-elevated/50">
                        <td className="px-3 py-2 text-text-muted">{t.date?.slice(0, 10)}</td>
                        <td className="px-3 py-2 text-text-primary max-w-xs truncate">{t.description}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${t.type === "debit" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className={`px-3 py-2 font-medium ${t.type === "debit" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          ₹{t.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2 text-text-muted">{t.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importPreview.transactions.length > 10 && (
                <p className="text-xs text-text-muted mb-4">… and {importPreview.transactions.length - 10} more rows</p>
              )}
              <div className="flex gap-3 justify-end">
                <button onClick={cancelImport} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
                <button onClick={confirmImport} disabled={importing}
                  className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors disabled:opacity-60">
                  {importing ? "Importing…" : `Import ${importPreview.transactions.length} transactions`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Import success/error */}
      {importStatus && (
        <div className={`rounded-xl px-5 py-4 text-sm border ${importStatus.error ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300" : "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-300"}`}>
          {importStatus.error
            ? importStatus.error
            : `✓ ${importStatus.inserted} transactions imported · ${importStatus.skipped} duplicates skipped`}
          <button onClick={() => setImportStatus(null)} className="ml-3 text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Account list */}
      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-5xl mb-3">🏦</p>
          <p>No accounts yet. Add your first bank account or credit card.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: (acc.color || COLORS[0]) + "22" }}>
                    {BANK_ICONS[acc.bankName] ?? "🏦"}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{acc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{acc.bankName}</span>
                      {acc.lastFourDigits && <span className="text-xs text-text-muted">••••{acc.lastFourDigits}</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_BADGE[acc.accountType] ?? ""}`}>
                        {ACCOUNT_TYPES.find((t) => t.value === acc.accountType)?.label ?? acc.accountType}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(acc)} className="text-xs text-text-muted hover:text-accent transition-colors">Edit</button>
                  <button onClick={() => handleDelete(acc.id)} className="text-xs text-text-muted hover:text-red-500 transition-colors">Delete</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-text-muted">
                  <span className="font-medium text-text-secondary">{acc._count?.transactions ?? 0}</span> transactions ·{" "}
                  last import <span className="font-medium text-text-secondary">{fmtDate(acc.lastImportedAt)}</span>
                </div>
                <button onClick={() => startImport(acc)}
                  className="text-xs bg-bg-elevated hover:bg-accent hover:text-white border border-border px-3 py-1.5 rounded-lg transition-colors">
                  Import CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-bg-elevated border border-border px-5 py-4 text-xs text-text-muted space-y-1">
        <p className="font-medium text-text-secondary">How to import</p>
        <p>1. Log in to your bank's net banking portal and download a statement as CSV.</p>
        <p>2. Click <strong>Import CSV</strong> on the matching account above.</p>
        <p>3. Review the preview and confirm — duplicates are skipped automatically.</p>
        <p>Supported banks: HDFC (savings + credit card), SBI, Axis Bank, Bank of Baroda.</p>
      </div>
    </div>
  );
}
