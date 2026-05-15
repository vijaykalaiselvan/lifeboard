import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// Income
router.get("/income", async (req, res) => {
  const items = await prisma.income.findMany({ where: { userId: req.userId }, orderBy: { receivedAt: "desc" } });
  res.json(items);
});

router.post("/income", async (req, res) => {
  const { source, amount, currency, frequency, receivedAt, note } = req.body;
  const item = await prisma.income.create({
    data: { userId: req.userId, source, amount, currency, frequency, receivedAt: receivedAt ? new Date(receivedAt) : undefined, note },
  });
  res.status(201).json(item);
});

router.put("/income/:id", async (req, res) => {
  const { source, amount, currency, frequency, receivedAt, note } = req.body;
  const item = await prisma.income.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: { source, amount, currency, frequency, receivedAt: receivedAt ? new Date(receivedAt) : undefined, note },
  });
  res.json(item);
});

router.delete("/income/:id", async (req, res) => {
  await prisma.income.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.status(204).end();
});

// Expenses
router.get("/expenses", async (req, res) => {
  const items = await prisma.expense.findMany({ where: { userId: req.userId }, orderBy: { spentAt: "desc" } });
  res.json(items);
});

router.post("/expenses", async (req, res) => {
  const { category, description, amount, currency, spentAt, note } = req.body;
  const item = await prisma.expense.create({
    data: { userId: req.userId, category, description, amount, currency, spentAt: spentAt ? new Date(spentAt) : undefined, note },
  });
  res.status(201).json(item);
});

router.put("/expenses/:id", async (req, res) => {
  const { category, description, amount, currency, spentAt, note } = req.body;
  const item = await prisma.expense.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: { category, description, amount, currency, spentAt: spentAt ? new Date(spentAt) : undefined, note },
  });
  res.json(item);
});

router.delete("/expenses/:id", async (req, res) => {
  await prisma.expense.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.status(204).end();
});

// Investments
router.get("/investments", async (req, res) => {
  const items = await prisma.investment.findMany({ where: { userId: req.userId } });
  res.json(items);
});

router.post("/investments", async (req, res) => {
  const { name, type, currentValue, costBasis, currency, notes } = req.body;
  const item = await prisma.investment.create({
    data: { userId: req.userId, name, type, currentValue, costBasis, currency, notes },
  });
  res.status(201).json(item);
});

router.put("/investments/:id", async (req, res) => {
  const { name, type, currentValue, costBasis, currency, notes } = req.body;
  await prisma.investment.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: { name, type, currentValue, costBasis, currency, notes },
  });
  res.json({ ok: true });
});

router.delete("/investments/:id", async (req, res) => {
  await prisma.investment.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.status(204).end();
});

// Debts
router.get("/debts", async (req, res) => {
  const items = await prisma.debt.findMany({ where: { userId: req.userId } });
  res.json(items);
});

router.post("/debts", async (req, res) => {
  const { name, type, principal, interestRate, minimumPayment, dueDate, currency, notes } = req.body;
  const item = await prisma.debt.create({
    data: { userId: req.userId, name, type, principal, interestRate, minimumPayment, dueDate: dueDate ? new Date(dueDate) : undefined, currency, notes },
  });
  res.status(201).json(item);
});

router.put("/debts/:id", async (req, res) => {
  const { name, type, principal, interestRate, minimumPayment, dueDate, currency, notes } = req.body;
  await prisma.debt.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: { name, type, principal, interestRate, minimumPayment, dueDate: dueDate ? new Date(dueDate) : undefined, currency, notes },
  });
  res.json({ ok: true });
});

router.delete("/debts/:id", async (req, res) => {
  await prisma.debt.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.status(204).end();
});

export default router;
