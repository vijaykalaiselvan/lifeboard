import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function PUT(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const { id } = await params;
  const { personName, amount, currency, lentAt, note, status } = await request.json();
  await prisma.lentRecord.updateMany({
    where: { id: Number(id), profileId },
    data: {
      personName,
      amount: parseFloat(amount),
      currency: currency || "INR",
      lentAt: lentAt ? new Date(lentAt) : undefined,
      note: note || null,
      status: status || "active",
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
  await prisma.lentRecord.deleteMany({ where: { id: Number(id), profileId } });
  return new NextResponse(null, { status: 204 });
}
