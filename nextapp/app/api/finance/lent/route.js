import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const items = await prisma.lentRecord.findMany({
    where: { profileId },
    include: { repayments: { orderBy: { repaidAt: "asc" } } },
    orderBy: { lentAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const { personName, amount, currency, lentAt, note } = await request.json();
  const item = await prisma.lentRecord.create({
    data: {
      profileId,
      personName,
      amount: parseFloat(amount),
      currency: currency || "INR",
      lentAt: lentAt ? new Date(lentAt) : new Date(),
      note: note || null,
      status: "active",
    },
    include: { repayments: true },
  });
  return NextResponse.json(item, { status: 201 });
}
