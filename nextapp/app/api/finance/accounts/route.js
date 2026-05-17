import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const accounts = await prisma.bankAccount.findMany({
    where: { profileId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { transactions: true } } },
  });
  return NextResponse.json(accounts);
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const { name, bankName, accountType, lastFourDigits, currency, color } = await request.json();
  const account = await prisma.bankAccount.create({
    data: { profileId, name, bankName, accountType, lastFourDigits, currency: currency || "INR", color },
    include: { _count: { select: { transactions: true } } },
  });
  return NextResponse.json(account, { status: 201 });
}
