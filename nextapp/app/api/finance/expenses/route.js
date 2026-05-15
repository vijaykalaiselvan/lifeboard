import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const items = await prisma.expense.findMany({ where: { profileId }, orderBy: { spentAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { category, description, amount, currency, spentAt, note } = await request.json();
  const item = await prisma.expense.create({
    data: { profileId, category, description, amount, currency, spentAt: spentAt ? new Date(spentAt) : undefined, note },
  });
  return NextResponse.json(item, { status: 201 });
}
