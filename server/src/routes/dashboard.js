import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const pid = req.profileId;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [incomes, expenses, investments, debts, tasks, habits, goals] = await Promise.all([
    prisma.income.findMany({ where: { profileId: pid } }),
    prisma.expense.findMany({ where: { profileId: pid } }),
    prisma.investment.findMany({ where: { profileId: pid } }),
    prisma.debt.findMany({ where: { profileId: pid } }),
    prisma.task.findMany({ where: { profileId: pid } }),
    prisma.habit.findMany({ where: { profileId: pid, active: true }, include: { logs: { where: { date: today } } } }),
    prisma.goal.findMany({ where: { profileId: pid, status: "active" } }),
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
