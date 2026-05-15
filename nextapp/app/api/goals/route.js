import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const goals = await prisma.goal.findMany({
    where: { profileId },
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(goals);
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { title, description, category, status, targetDate, progress } = await request.json();
  const goal = await prisma.goal.create({
    data: { profileId, title, description, category, status, targetDate: targetDate ? new Date(targetDate) : undefined, progress },
    include: { milestones: true },
  });
  return NextResponse.json(goal, { status: 201 });
}
