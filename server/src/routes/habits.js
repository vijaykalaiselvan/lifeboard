import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const habits = await prisma.habit.findMany({ where: { userId: req.userId } });
  res.json(habits.map((h) => ({ ...h, targetDays: JSON.parse(h.targetDays) })));
});

router.post("/", async (req, res) => {
  const { name, description, frequency, targetDays = [], color, icon } = req.body;
  const habit = await prisma.habit.create({
    data: { userId: req.userId, name, description, frequency, targetDays: JSON.stringify(targetDays), color, icon },
  });
  res.status(201).json({ ...habit, targetDays: JSON.parse(habit.targetDays) });
});

router.put("/:id", async (req, res) => {
  const { name, description, frequency, targetDays, color, icon, active } = req.body;
  await prisma.habit.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(frequency !== undefined && { frequency }),
      ...(targetDays !== undefined && { targetDays: JSON.stringify(targetDays) }),
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
      ...(active !== undefined && { active }),
    },
  });
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  await prisma.habit.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.status(204).end();
});

// Habit logs
router.post("/:id/log", async (req, res) => {
  const { date, completed = true, note } = req.body;
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: Number(req.params.id), date: d } },
    update: { completed, note },
    create: { userId: req.userId, habitId: Number(req.params.id), date: d, completed, note },
  });
  res.json(log);
});

router.get("/:id/logs", async (req, res) => {
  const { from, to } = req.query;
  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: Number(req.params.id),
      userId: req.userId,
      ...(from && to && { date: { gte: new Date(from), lte: new Date(to) } }),
    },
    orderBy: { date: "asc" },
  });
  res.json(logs);
});

export default router;
