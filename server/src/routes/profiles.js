import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const profiles = await prisma.profile.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
  });
  res.json(profiles);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });
  const profile = await prisma.profile.create({
    data: { userId: req.userId, name: name.trim() },
  });
  res.status(201).json(profile);
});

router.put("/:id", async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });
  await prisma.profile.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: { name: name.trim() },
  });
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  const count = await prisma.profile.count({ where: { userId: req.userId } });
  if (count <= 1) {
    return res.status(400).json({ error: "Cannot delete the last profile" });
  }
  await prisma.profile.deleteMany({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  res.status(204).end();
});

export default router;
