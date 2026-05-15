import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.userId },
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(goals);
});

router.post("/", async (req, res) => {
  const { title, description, category, status, targetDate, progress } = req.body;
  const goal = await prisma.goal.create({
    data: {
      userId: req.userId,
      title,
      description,
      category,
      status,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      progress,
    },
    include: { milestones: true },
  });
  res.status(201).json(goal);
});

router.put("/:id", async (req, res) => {
  const { title, description, category, status, targetDate, progress } = req.body;
  await prisma.goal.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(status !== undefined && { status }),
      ...(targetDate !== undefined && { targetDate: new Date(targetDate) }),
      ...(progress !== undefined && { progress }),
    },
  });
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  await prisma.goal.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.status(204).end();
});

// Milestones
router.post("/:id/milestones", async (req, res) => {
  const { title, dueDate } = req.body;
  const ms = await prisma.goalMilestone.create({
    data: { userId: req.userId, goalId: Number(req.params.id), title, dueDate: dueDate ? new Date(dueDate) : undefined },
  });
  res.status(201).json(ms);
});

router.put("/:id/milestones/:msId", async (req, res) => {
  const { title, completed, dueDate } = req.body;
  await prisma.goalMilestone.updateMany({
    where: { id: Number(req.params.msId), goalId: Number(req.params.id), userId: req.userId },
    data: {
      ...(title !== undefined && { title }),
      ...(completed !== undefined && { completed, completedAt: completed ? new Date() : null }),
      ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
    },
  });
  res.json({ ok: true });
});

router.delete("/:id/milestones/:msId", async (req, res) => {
  await prisma.goalMilestone.deleteMany({
    where: { id: Number(req.params.msId), goalId: Number(req.params.id), userId: req.userId },
  });
  res.status(204).end();
});

export default router;
