import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function PUT(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { id, msId } = await params;
  const { title, completed, dueDate } = await request.json();
  await prisma.goalMilestone.updateMany({
    where: { id: Number(msId), goalId: Number(id), profileId },
    data: {
      ...(title !== undefined && { title }),
      ...(completed !== undefined && { completed, completedAt: completed ? new Date() : null }),
      ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { id, msId } = await params;
  await prisma.goalMilestone.deleteMany({
    where: { id: Number(msId), goalId: Number(id), profileId },
  });
  return new NextResponse(null, { status: 204 });
}
