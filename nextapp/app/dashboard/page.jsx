"use client";
import { useState, useEffect } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-bg-surface border border-border rounded-xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">Welcome back — here's your overview.</p>
        </div>

        {loading ? (
          <p className="text-text-muted text-sm">Loading…</p>
        ) : !data ? (
          <p className="text-text-muted text-sm">Failed to load dashboard.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <SectionLabel>Finance</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Net Worth</p>
                  <p className={`text-2xl font-bold mt-1 ${data.finance.netWorth >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {fmt(data.finance.netWorth)}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Income</p>
                  <p className="text-2xl font-bold text-green-500 mt-1">{fmt(data.finance.totalIncome)}</p>
                </Card>
                <Card>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-500 mt-1">{fmt(data.finance.totalExpenses)}</p>
                </Card>
                <Card>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Investments</p>
                  <p className="text-2xl font-bold text-accent mt-1">{fmt(data.finance.totalInvested)}</p>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <SectionLabel>Tasks</SectionLabel>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">Total</span>
                    <span className="text-text-primary font-medium">{data.tasks.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">To Do</span>
                    <span className="text-text-secondary font-medium">{data.tasks.todo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">In Progress</span>
                    <span className="text-yellow-500 font-medium">{data.tasks.inProgress}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">Done</span>
                    <span className="text-green-500 font-medium">{data.tasks.done}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionLabel>Habits Today</SectionLabel>
                <p className="text-4xl font-bold text-text-primary">
                  {data.habits.completedToday}
                  <span className="text-text-muted text-lg"> / {data.habits.total}</span>
                </p>
                <p className="text-xs text-text-muted mt-1">habits completed today</p>
              </Card>

              <Card>
                <SectionLabel>Goals</SectionLabel>
                <p className="text-4xl font-bold text-accent">
                  {data.goals.avgProgress}
                  <span className="text-text-muted text-lg">%</span>
                </p>
                <p className="text-xs text-text-muted mt-1">avg. progress across {data.goals.total} active goals</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
