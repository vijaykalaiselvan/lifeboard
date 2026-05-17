"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

function fmtINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function fmtCcy(n, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 }).format(n);
}

function payoffMonths(principal, interestRate, minimumPayment) {
  if (!minimumPayment || minimumPayment <= 0) return null;
  const r = interestRate / 100 / 12;
  if (r === 0) return Math.ceil(principal / minimumPayment);
  const interest = principal * r;
  if (minimumPayment <= interest) return null;
  return Math.ceil(-Math.log(1 - interest / minimumPayment) / Math.log(1 + r));
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + Math.ceil(months));
  return d;
}

function Badge({ color, children }) {
  const styles = {
    red:    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
    green:  "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[color]}`}>{children}</span>;
}

function currentMonthRange() {
  const d = new Date();
  const y = d.getFullYear(), m = d.getMonth() + 1;
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const to   = `${y}-${String(m).padStart(2, "0")}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
  return { from, to };
}

export default function OverviewTab() {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [bankCredits, setBankCredits] = useState([]);
  const [bankDebits, setBankDebits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { from, to } = currentMonthRange();
    Promise.all([
      api.get("/finance/income"),
      api.get("/finance/expenses"),
      api.get("/finance/debts"),
      api.get(`/finance/transactions?type=credit&from=${from}&to=${to}&limit=500`),
      api.get(`/finance/transactions?type=debit&from=${from}&to=${to}&limit=500`),
    ])
      .then(([i, e, d, tc, td]) => {
        setIncomes(i.data);
        setExpenses(e.data);
        setDebts(d.data);
        setBankCredits(tc.data.transactions ?? []);
        setBankDebits(td.data.transactions ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted text-sm">Loading…</p>;

  const manualIncome   = incomes.filter((i) => i.frequency === "monthly").reduce((s, i) => s + i.amount, 0);
  const bankCreditAmt  = bankCredits.reduce((s, t) => s + t.amount, 0);
  const monthlyIncome  = manualIncome + bankCreditAmt;

  const totalEmi       = debts.reduce((s, d) => s + (d.minimumPayment ?? 0), 0);

  const manualExpenses  = expenses.reduce((s, e) => s + e.amount, 0);
  const bankDebitAmt    = bankDebits.filter((t) => t.category !== "Debt").reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = manualExpenses + bankDebitAmt;

  const netSurplus  = monthlyIncome - totalEmi - monthlyExpenses;
  const emiRatio    = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0;
  const savingsRate = monthlyIncome > 0 ? (netSurplus / monthlyIncome) * 100 : 0;
  const sortedDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Monthly Cash Flow */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Monthly Cash Flow</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Income",      value: monthlyIncome,    sub: bankCreditAmt > 0 ? `incl. ₹${bankCreditAmt.toLocaleString("en-IN")} from bank` : null, color: "text-green-600 dark:text-green-400" },
            { label: "EMIs",        value: totalEmi,         sub: null, color: "text-red-600 dark:text-red-400" },
            { label: "Expenses",    value: monthlyExpenses,  sub: bankDebitAmt > 0 ? `incl. ₹${bankDebitAmt.toLocaleString("en-IN")} from bank` : null, color: "text-orange-600 dark:text-orange-400" },
            { label: "Net Surplus", value: netSurplus,       sub: null, color: netSurplus >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
              <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{fmtINR(value)}</p>
              {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Financial Health */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Financial Health</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-text-primary">EMI-to-Income Ratio</p>
              <Badge color={emiRatio >= 55 ? "red" : emiRatio >= 40 ? "yellow" : "green"}>
                {emiRatio >= 55 ? "Danger" : emiRatio >= 40 ? "Warning" : "Safe"}
              </Badge>
            </div>
            <p className={`text-3xl font-bold ${emiRatio >= 55 ? "text-red-600 dark:text-red-400" : emiRatio >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
              {emiRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-text-muted mt-1">Target: below 40% · Danger above 55%</p>
            <div className="mt-3 h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${emiRatio >= 55 ? "bg-red-500" : emiRatio >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(emiRatio, 100)}%` }} />
            </div>
          </div>

          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-text-primary">Savings Rate</p>
              <Badge color={savingsRate < 10 ? "red" : savingsRate < 20 ? "yellow" : "green"}>
                {savingsRate < 10 ? "Danger" : savingsRate < 20 ? "Warning" : "Good"}
              </Badge>
            </div>
            <p className={`text-3xl font-bold ${savingsRate < 10 ? "text-red-600 dark:text-red-400" : savingsRate < 20 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
              {savingsRate.toFixed(1)}%
            </p>
            <p className="text-xs text-text-muted mt-1">Target: above 20% · Danger below 10%</p>
            <div className="mt-3 h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${savingsRate < 10 ? "bg-red-500" : savingsRate < 20 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Debt Payoff Timeline */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Debt Payoff Timeline</p>
        {debts.length === 0 ? (
          <p className="text-text-muted text-sm">No debts tracked.</p>
        ) : (
          <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-elevated">
                  {["Debt", "Balance", "Rate", "EMI / mo", "Closes"].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedDebts.map((debt, idx) => {
                  const months = payoffMonths(debt.principal, debt.interestRate, debt.minimumPayment);
                  const closeDate = months ? addMonths(now, months) : null;
                  return (
                    <tr key={debt.id} className="hover:bg-bg-elevated/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">{debt.name}</span>
                          {idx === 0 && <Badge color="red">Pay First</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-red-600 dark:text-red-400">
                        {fmtCcy(debt.principal, debt.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-orange-600 dark:text-orange-400">{debt.interestRate}%</td>
                      <td className="px-5 py-3.5 text-right text-text-secondary">
                        {debt.minimumPayment ? fmtCcy(debt.minimumPayment, debt.currency) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {closeDate ? (
                          <span className="text-text-primary">
                            {closeDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            <span className="text-text-muted text-xs ml-1.5">({months} mo)</span>
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
