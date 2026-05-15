import { useState } from "react";
import IncomeTab from "./IncomeTab";
import ExpensesTab from "./ExpensesTab";
import InvestmentsTab from "./InvestmentsTab";
import DebtsTab from "./DebtsTab";

const TABS = ["Income", "Expenses", "Investments", "Debts"];

export default function FinancePage() {
  const [tab, setTab] = useState("Income");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Finance</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6 w-fit border border-gray-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Income"      && <IncomeTab />}
      {tab === "Expenses"    && <ExpensesTab />}
      {tab === "Investments" && <InvestmentsTab />}
      {tab === "Debts"       && <DebtsTab />}
    </div>
  );
}
