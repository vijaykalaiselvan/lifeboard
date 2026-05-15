import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// Returns an aggregated summary for the dashboard
router.get("/", async (req, res) => {
  const uid = req.userId;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [incomes, expenses, investments, debts, tasks, habits, goals] = await Promise.all([
    prisma.income.findMany({ where: { userId: uid } }),
    prisma.expense.findMany({ where: { userId: uid } }),
    prisma.investment.findMany({ where: { userId: uid } }),
    prisma.debt.findMany({ where: { userId: uid } }),
    prisma.task.findMany({ where: { userId: uid } }),
    prisma.habit.findMany({ where: { userId: uid, active: true }, include: { logs: { where: { date: today } } } }),
    prisma.goal.findMany({ where: { userId: uid, status: "active" } }),
  ]);

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalInvested = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalDebt = debts.reduce((s, d) => s + d.principal, 0);

  res.json({
    finance: {
      totalIncome,
      totalExpenses,
      netWorth: totalInvested - totalDebt,
      totalInvested,
      totalDebt,
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
});

export default router;
