import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { searchParams } = new URL(request.url);
  const where = { profileId };
  if (searchParams.get("status")) where.status = searchParams.get("status");
  if (searchParams.get("priority")) where.priority = searchParams.get("priority");
  const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(tasks);
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { title, description, status, priority, dueDate } = await request.json();
  const task = await prisma.task.create({
    data: { profileId, title, description, status, priority, dueDate: dueDate ? new Date(dueDate) : undefined },
  });
  return NextResponse.json(task, { status: 201 });
}
