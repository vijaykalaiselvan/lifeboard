import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function PUT(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const { id } = await params;
  const { name, bankName, accountType, lastFourDigits, currency, color } = await request.json();
  await prisma.bankAccount.updateMany({
    where: { id: Number(id), profileId },
    data: {
      ...(name !== undefined && { name }),
      ...(bankName !== undefined && { bankName }),
      ...(accountType !== undefined && { accountType }),
      ...(lastFourDigits !== undefined && { lastFourDigits }),
      ...(currency !== undefined && { currency }),
      ...(color !== undefined && { color }),
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
  await prisma.bankAccount.deleteMany({ where: { id: Number(id), profileId } });
  return new NextResponse(null, { status: 204 });
}
