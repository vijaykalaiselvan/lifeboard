"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

const CATEGORIES = ["Food", "Transport", "Shopping", "Utilities", "Entertainment", "Health", "Education", "Housing", "Debt", "Income", "Other"];

const CAT_COLORS = {
  Food:          "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  Transport:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  Shopping:      "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  Utilities:     "bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400",
  Entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  Health:        "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  Education:     "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  Housing:       "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  Debt:          "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Income:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Other:         "bg-bg-elevated text-text-secondary",
};

function fmtINR(n) {
  return "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function TransactionsTab() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState(null); // txn id
  const [expandedRow, setExpandedRow] = useState(null);

  // Filters
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  useEffect(() => {
    api.get("/finance/accounts").then(({ data }) => setAccounts(data));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (accountId) params.set("accountId", accountId);
      if (category)  params.set("category", category);
      if (type)      params.set("type", type);
      if (from)      params.set("from", from);
      if (to)        params.set("to", to);
      if (search)    params.set("search", search);
      params.set("limit", LIMIT);
      params.set("offset", offset);

      const { data } = await api.get(`/finance/transactions?${params.toString()}`);
      setTransactions(data.transactions);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [accountId, category, type, from, to, search, offset]);

  useEffect(() => { setOffset(0); }, [accountId, category, type, from, to, search]);
  useEffect(() => { load(); }, [load]);

  async function updateCategory(id, cat) {
    await api.put(`/finance/transactions/${id}`, { category: cat });
    setEditingCat(null);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/finance/transactions/${id}`);
    load();
  }

  // Summary for current filter (debit/credit totals across displayed transactions)
  const totalDebits  = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const totalCredits = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Debits</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{fmtINR(totalDebits)}</p>
          <p className="text-xs text-text-muted mt-0.5">{transactions.filter((t) => t.type === "debit").length} transactions</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Credits</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fmtINR(totalCredits)}</p>
          <p className="text-xs text-text-muted mt-0.5">{transactions.filter((t) => t.type === "credit").length} transactions</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-wider">Net</p>
          <p className={`text-2xl font-bold mt-1 ${totalCredits - totalDebits >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {totalCredits - totalDebits >= 0 ? "+" : ""}{fmtINR(totalCredits - totalDebits)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">{transactions.length} of {total} shown</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-bg-surface border border-border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
            <option value="">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
            <option value="">Debit + Credit</option>
            <option value="debit">Debit only</option>
            <option value="credit">Credit only</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            placeholder="From"
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            placeholder="To"
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description…"
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted" />
        </div>
        {(accountId || category || type || from || to || search) && (
          <button onClick={() => { setAccountId(""); setCategory(""); setType(""); setFrom(""); setTo(""); setSearch(""); }}
            className="mt-2 text-xs text-accent hover:text-accent/80">Clear filters</button>
        )}
      </div>

      {/* Transaction list */}
      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-5xl mb-3">📊</p>
          <p>{total === 0 && !accountId && !category && !type && !from && !to && !search
            ? "No transactions yet. Go to the Accounts tab and import a CSV statement."
            : "No transactions match your filters."}</p>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-elevated">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Account</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((txn) => {
                const isExpanded = expandedRow === txn.id;
                return (
                  <>
                    <tr key={txn.id}
                      className="hover:bg-bg-elevated/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : txn.id)}>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(txn.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="px-4 py-3 text-text-primary max-w-xs">
                        <p className="truncate">{txn.description}</p>
                        {txn.reference && <p className="text-xs text-text-muted truncate">{txn.reference}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {editingCat === txn.id ? (
                          <select autoFocus defaultValue={txn.category || "Other"}
                            onBlur={(e) => updateCategory(txn.id, e.target.value)}
                            onChange={(e) => updateCategory(txn.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs bg-bg-elevated border border-accent rounded px-2 py-1 text-text-primary focus:outline-none">
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setEditingCat(txn.id); }}
                            className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${CAT_COLORS[txn.category] ?? CAT_COLORS["Other"]}`}>
                            {txn.category || "Other"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: txn.account?.color || "#7c3aed" }} />
                          <span className="text-xs text-text-muted truncate max-w-24">{txn.account?.name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${txn.type === "debit" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                        {txn.type === "debit" ? "−" : "+"}{fmtINR(txn.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(txn.id); }}
                          className="text-text-muted hover:text-red-500 text-xs transition-colors">✕</button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${txn.id}-expanded`} className="bg-bg-elevated/30">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex gap-6 text-xs text-text-secondary">
                            <div><span className="text-text-muted">Full description:</span> {txn.description}</div>
                            {txn.balance != null && <div><span className="text-text-muted">Balance after:</span> ₹{txn.balance.toLocaleString("en-IN")}</div>}
                            {txn.reference && <div><span className="text-text-muted">Reference:</span> {txn.reference}</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Showing {offset + 1}–{Math.min(offset + transactions.length, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-elevated transition-colors">
              Previous
            </button>
            <button disabled={offset + LIMIT >= total} onClick={() => setOffset(offset + LIMIT)}
              className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-elevated transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
