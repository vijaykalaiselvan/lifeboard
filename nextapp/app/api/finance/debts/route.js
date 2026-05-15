import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const items = await prisma.debt.findMany({ where: { profileId } });
  return NextResponse.json(items);
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { name, type, principal, interestRate, minimumPayment, dueDate, currency, notes } = await request.json();
  const item = await prisma.debt.create({
    data: { profileId, name, type, principal, interestRate, minimumPayment, dueDate: dueDate ? new Date(dueDate) : undefined, currency, notes },
  });
  return NextResponse.json(item, { status: 201 });
}
