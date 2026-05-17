import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function POST(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const { id } = await params;
  const lentId = Number(id);

  // Verify ownership
  const record = await prisma.lentRecord.findFirst({ where: { id: lentId, profileId }, include: { repayments: true } });
  if (!record) return forbidden();

  const { amount, repaidAt, note } = await request.json();
  const repayment = await prisma.lentRepayment.create({
    data: {
      lentId,
      amount: parseFloat(amount),
      repaidAt: repaidAt ? new Date(repaidAt) : new Date(),
      note: note || null,
    },
  });

  // Auto-settle if fully repaid
  const totalRepaid = record.repayments.reduce((s, r) => s + r.amount, 0) + parseFloat(amount);
  if (totalRepaid >= record.amount) {
    await prisma.lentRecord.update({ where: { id: lentId }, data: { status: "settled" } });
  }

  return NextResponse.json(repayment, { status: 201 });
}
