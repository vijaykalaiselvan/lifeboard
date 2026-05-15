import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const notes = await prisma.note.findMany({
    where: { profileId: req.profileId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  res.json(notes.map((n) => ({ ...n, tags: JSON.parse(n.tags) })));
});

router.post("/", async (req, res) => {
  const { title, content, tags = [], pinned } = req.body;
  const note = await prisma.note.create({
    data: { profileId: req.profileId, title, content, tags: JSON.stringify(tags), pinned },
  });
  res.status(201).json({ ...note, tags: JSON.parse(note.tags) });
});

router.put("/:id", async (req, res) => {
  const { title, content, tags, pinned } = req.body;
  await prisma.note.updateMany({
    where: { id: Number(req.params.id), profileId: req.profileId },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(pinned !== undefined && { pinned }),
    },
  });
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  await prisma.note.deleteMany({ where: { id: Number(req.params.id), profileId: req.profileId } });
  res.status(204).end();
});

export default router;
