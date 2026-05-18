"use client";
import { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import OverviewTab from "@/components/finance/OverviewTab";
import IncomeTab from "@/components/finance/IncomeTab";
import ExpensesTab from "@/components/finance/ExpensesTab";
import InvestmentsTab from "@/components/finance/InvestmentsTab";
import DebtsTab from "@/components/finance/DebtsTab";
import LentTab from "@/components/finance/LentTab";
import AccountsTab from "@/components/finance/AccountsTab";
import TransactionsTab from "@/components/finance/TransactionsTab";

const TABS = ["Overview", "Income", "Expenses", "Investments", "Debts", "Lent", "Accounts", "Transactions"];

export default function FinancePage() {
  const [tab, setTab] = useState("Overview");

  return (
    <ProtectedLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight mb-5 md:mb-6">Finance</h1>

        {/* Tab bar — horizontally scrollable on mobile so all 8 tabs are reachable. */}
        <div className="-mx-4 md:mx-0 px-4 md:px-0 mb-5 md:mb-6 overflow-x-auto">
          <div className="flex gap-1 bg-bg-surface rounded-xl p-1 w-fit border border-border">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 md:px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t ? "bg-accent text-white shadow" : "text-text-secondary hover:text-text-primary"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "Overview"      && <OverviewTab />}
        {tab === "Income"        && <IncomeTab />}
        {tab === "Expenses"      && <ExpensesTab />}
        {tab === "Investments"   && <InvestmentsTab />}
        {tab === "Debts"         && <DebtsTab />}
        {tab === "Lent"          && <LentTab />}
        {tab === "Accounts"      && <AccountsTab />}
        {tab === "Transactions"  && <TransactionsTab />}
      </div>
    </ProtectedLayout>
  );
}
