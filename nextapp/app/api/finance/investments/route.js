import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const items = await prisma.investment.findMany({ where: { profileId } });
  return NextResponse.json(items);
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { name, type, currentValue, costBasis, currency, notes } = await request.json();
  const item = await prisma.investment.create({ data: { profileId, name, type, currentValue, costBasis, currency, notes } });
  return NextResponse.json(item, { status: 201 });
}
