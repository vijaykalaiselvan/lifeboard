import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const items = await prisma.income.findMany({ where: { profileId }, orderBy: { receivedAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { source, amount, currency, frequency, receivedAt, note } = await request.json();
  const item = await prisma.income.create({
    data: { profileId, source, amount, currency, frequency, receivedAt: receivedAt ? new Date(receivedAt) : undefined, note },
  });
  return NextResponse.json(item, { status: 201 });
}
