import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: Number(id),
      profileId,
      ...(from && to && { date: { gte: new Date(from), lte: new Date(to) } }),
    },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(logs);
}
