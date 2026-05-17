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

  // First day of current month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  const [incomes, expenses, investments, debts, tasks, habits, goals, bankCredits, bankDebits, lentRecords] = await Promise.all([
    prisma.income.findMany({ where: { profileId } }),
    prisma.expense.findMany({ where: { profileId } }),
    prisma.investment.findMany({ where: { profileId } }),
    prisma.debt.findMany({ where: { profileId } }),
    prisma.task.findMany({ where: { profileId } }),
    prisma.habit.findMany({ where: { profileId, active: true }, include: { logs: { where: { date: today } } } }),
    prisma.goal.findMany({ where: { profileId, status: "active" } }),
    prisma.transaction.findMany({ where: { profileId, type: "credit", date: { gte: monthStart, lte: monthEnd } } }),
    prisma.transaction.findMany({ where: { profileId, type: "debit",  date: { gte: monthStart, lte: monthEnd } } }),
    prisma.lentRecord.findMany({ where: { profileId }, include: { repayments: true } }),
  ]);

  // Manual entries
  const manualMonthlyIncome  = incomes.filter((i) => i.frequency === "monthly").reduce((s, i) => s + i.amount, 0);
  const manualMonthlyExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalEmi             = debts.reduce((s, d) => s + (d.minimumPayment ?? 0), 0);

  // Bank transactions this month
  const bankCreditTotal = bankCredits.reduce((s, t) => s + t.amount, 0);
  const bankDebitTotal  = bankDebits.filter((t) => t.category !== "Debt").reduce((s, t) => s + t.amount, 0);

  const monthlyIncome   = manualMonthlyIncome + bankCreditTotal;
  const monthlyExpenses = manualMonthlyExpenses + bankDebitTotal;
  const netSurplus  = monthlyIncome - totalEmi - monthlyExpenses;
  const emiRatio    = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0;
  const savingsRate = monthlyIncome > 0 ? (netSurplus / monthlyIncome) * 100 : 0;

  // All-time totals (manual + bank)
  const allBankCredits = await prisma.transaction.aggregate({ where: { profileId, type: "credit" }, _sum: { amount: true } });
  const allBankDebits  = await prisma.transaction.aggregate({ where: { profileId, type: "debit"  }, _sum: { amount: true } });

  const totalIncome   = incomes.reduce((s, i) => s + i.amount, 0)  + (allBankCredits._sum.amount ?? 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0) + (allBankDebits._sum.amount  ?? 0);
  const totalInvested = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalDebt     = debts.reduce((s, d) => s + d.principal, 0);
  const netWorth      = totalInvested - totalDebt;

  // Lent money summary
  const lentWithBalance = lentRecords.map((r) => {
    const repaid = r.repayments.reduce((s, p) => s + p.amount, 0);
    return { personName: r.personName, outstanding: Math.max(0, r.amount - repaid) };
  });
  const totalLent        = lentRecords.reduce((s, r) => s + r.amount, 0);
  const totalOutstanding = lentWithBalance.reduce((s, r) => s + r.outstanding, 0);
  const settledCount     = lentRecords.filter((r) => r.status === "settled").length;

  const byPerson = {};
  lentWithBalance.forEach(({ personName, outstanding }) => {
    const key = personName.toLowerCase();
    if (!byPerson[key]) byPerson[key] = { name: personName, outstanding: 0 };
    byPerson[key].outstanding += outstanding;
  });
  const topOwing = Object.values(byPerson)
    .filter((p) => p.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 4);

  return NextResponse.json({
    finance: { totalIncome, totalExpenses, netWorth, totalInvested, totalDebt },
    lent: { totalLent, totalOutstanding, peopleCount: topOwing.length, settledCount, topOwing },
    healthIndicators: {
      monthlyIncome,
      totalEmi,
      totalExpenses: monthlyExpenses,
      netSurplus,
      emiRatio:    parseFloat(emiRatio.toFixed(1)),
      savingsRate: parseFloat(savingsRate.toFixed(1)),
    },
    tasks: {
      total:      tasks.length,
      todo:       tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      done:       tasks.filter((t) => t.status === "done").length,
    },
    habits: {
      total:          habits.length,
      completedToday: habits.filter((h) => h.logs.some((l) => l.completed)).length,
    },
    goals: {
      total:       goals.length,
      avgProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0,
    },
  });
}
