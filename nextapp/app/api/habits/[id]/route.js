import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function PUT(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { id } = await params;
  const { name, description, frequency, targetDays, color, icon, active } = await request.json();
  await prisma.habit.updateMany({
    where: { id: Number(id), profileId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(frequency !== undefined && { frequency }),
      ...(targetDays !== undefined && { targetDays: JSON.stringify(targetDays) }),
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
      ...(active !== undefined && { active }),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { id } = await params;
  await prisma.habit.deleteMany({ where: { id: Number(id), profileId } });
  return new NextResponse(null, { status: 204 });
}
