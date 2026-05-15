import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function POST(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { id } = await params;
  const habit = await prisma.habit.findFirst({ where: { id: Number(id), profileId } });
  if (!habit) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

  const { date, completed = true, note } = await request.json();
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: habit.id, date: d } },
    update: { completed, note },
    create: { profileId, habitId: habit.id, date: d, completed, note },
  });
  return NextResponse.json(log);
}
