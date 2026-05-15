import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const notes = await prisma.note.findMany({
    where: { profileId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(notes.map((n) => ({ ...n, tags: JSON.parse(n.tags) })));
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { title, content, tags = [], pinned } = await request.json();
  const note = await prisma.note.create({
    data: { profileId, title, content, tags: JSON.stringify(tags), pinned },
  });
  return NextResponse.json({ ...note, tags: JSON.parse(note.tags) }, { status: 201 });
}
