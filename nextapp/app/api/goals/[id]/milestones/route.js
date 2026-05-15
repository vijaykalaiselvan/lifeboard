import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function POST(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { id } = await params;
  const goal = await prisma.goal.findFirst({ where: { id: Number(id), profileId } });
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const { title, dueDate } = await request.json();
  const ms = await prisma.goalMilestone.create({
    data: { profileId, goalId: goal.id, title, dueDate: dueDate ? new Date(dueDate) : undefined },
  });
  return NextResponse.json(ms, { status: 201 });
}
