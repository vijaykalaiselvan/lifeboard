import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function PUT(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { id } = await params;
  const { category, description, amount, currency, spentAt, note } = await request.json();
  await prisma.expense.updateMany({
    where: { id: Number(id), profileId },
    data: { category, description, amount, currency, spentAt: spentAt ? new Date(spentAt) : undefined, note },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { id } = await params;
  await prisma.expense.deleteMany({ where: { id: Number(id), profileId } });
  return new NextResponse(null, { status: 204 });
}
