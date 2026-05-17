import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [incomes, expenses, investments, debts, tasks, habits, goals] = await Promise.all([
    prisma.income.findMany({ where: { profileId } }),
    prisma.expense.findMany({ where: { profileId } }),
    prisma.investment.findMany({ where: { profileId } }),
    prisma.debt.findMany({ where: { profileId } }),
    prisma.task.findMany({ where: { profileId } }),
    prisma.habit.findMany({ where: { profileId, active: true }, include: { logs: { where: { date: today } } } }),
    prisma.goal.findMany({ where: { profileId, status: "active" } }),
  ]);

  const monthlyIncome = incomes.filter((i) => i.frequency === "monthly").reduce((s, i) => s + i.amount, 0);
  const totalEmi = debts.reduce((s, d) => s + (d.minimumPayment ?? 0), 0);
  const totalMonthlyExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netSurplus = monthlyIncome - totalEmi - totalMonthlyExpenses;
  const emiRatio = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0;
  const savingsRate = monthlyIncome > 0 ? (netSurplus / monthlyIncome) * 100 : 0;

  return NextResponse.json({
    finance: {
      totalIncome: incomes.reduce((s, i) => s + i.amount, 0),
      totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
      netWorth: investments.reduce((s, i) => s + i.currentValue, 0) - debts.reduce((s, d) => s + d.principal, 0),
      totalInvested: investments.reduce((s, i) => s + i.currentValue, 0),
      totalDebt: debts.reduce((s, d) => s + d.principal, 0),
    },
    healthIndicators: {
      monthlyIncome,
      totalEmi,
      totalExpenses: totalMonthlyExpenses,
      netSurplus,
      emiRatio: parseFloat(emiRatio.toFixed(1)),
      savingsRate: parseFloat(savingsRate.toFixed(1)),
    },
    tasks: {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    },
    habits: {
      total: habits.length,
      completedToday: habits.filter((h) => h.logs.some((l) => l.completed)).length,
    },
    goals: {
      total: goals.length,
      avgProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0,
    },
  });
}
