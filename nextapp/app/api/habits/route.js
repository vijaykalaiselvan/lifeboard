import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const habits = await prisma.habit.findMany({ where: { profileId } });
  return NextResponse.json(habits.map((h) => ({ ...h, targetDays: JSON.parse(h.targetDays) })));
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { name, description, frequency, targetDays = [], color, icon } = await request.json();
  const habit = await prisma.habit.create({
    data: { profileId, name, description, frequency, targetDays: JSON.stringify(targetDays), color, icon },
  });
  return NextResponse.json({ ...habit, targetDays: JSON.parse(habit.targetDays) }, { status: 201 });
}
