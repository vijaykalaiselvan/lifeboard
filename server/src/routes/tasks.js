import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const { status, priority } = req.query;
  const where = { userId: req.userId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json(tasks);
});

router.post("/", async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;
  const task = await prisma.task.create({
    data: { userId: req.userId, title, description, status, priority, dueDate: dueDate ? new Date(dueDate) : undefined },
  });
  res.status(201).json(task);
});

router.put("/:id", async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;
  const completedAt = status === "done" ? new Date() : null;
  await prisma.task.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: { title, description, status, priority, dueDate: dueDate ? new Date(dueDate) : undefined, completedAt },
  });
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  await prisma.task.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.status(204).end();
});

export default router;
