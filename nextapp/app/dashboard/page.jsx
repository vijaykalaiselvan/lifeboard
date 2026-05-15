"use client";
import { useState, useEffect } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
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
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : !data ? (
          <p className="text-gray-500 text-sm">Failed to load dashboard.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Finance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Net Worth</p>
                  <p className={`text-2xl font-bold mt-1 ${data.finance.netWorth >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(data.finance.netWorth)}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Income</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{fmt(data.finance.totalIncome)}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{fmt(data.finance.totalExpenses)}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Investments</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">{fmt(data.finance.totalInvested)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Tasks</h2>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-gray-400 text-sm">Total</span><span className="text-white font-medium">{data.tasks.total}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 text-sm">To Do</span><span className="text-gray-300 font-medium">{data.tasks.todo}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 text-sm">In Progress</span><span className="text-yellow-400 font-medium">{data.tasks.inProgress}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 text-sm">Done</span><span className="text-green-400 font-medium">{data.tasks.done}</span></div>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Habits Today</h2>
                <p className="text-4xl font-bold text-white">{data.habits.completedToday}<span className="text-gray-500 text-lg"> / {data.habits.total}</span></p>
                <p className="text-xs text-gray-500 mt-1">habits completed today</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Goals</h2>
                <p className="text-4xl font-bold text-indigo-400">{data.goals.avgProgress}<span className="text-gray-500 text-lg">%</span></p>
                <p className="text-xs text-gray-500 mt-1">avg. progress across {data.goals.total} active goals</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
