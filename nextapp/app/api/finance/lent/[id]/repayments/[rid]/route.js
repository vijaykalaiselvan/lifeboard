import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function DELETE(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const { id, rid } = await params;
  const lentId = Number(id);

  // Verify ownership via parent record
  const record = await prisma.lentRecord.findFirst({ where: { id: lentId, profileId } });
  if (!record) return forbidden();

  await prisma.lentRepayment.delete({ where: { id: Number(rid) } });

  // Re-check if should revert to active
  const remaining = await prisma.lentRepayment.aggregate({ where: { lentId }, _sum: { amount: true } });
  const totalRepaid = remaining._sum.amount ?? 0;
  if (totalRepaid < record.amount) {
    await prisma.lentRecord.update({ where: { id: lentId }, data: { status: "active" } });
  }

  return new NextResponse(null, { status: 204 });
}
