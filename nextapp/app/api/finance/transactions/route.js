import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const category  = searchParams.get("category");
  const type      = searchParams.get("type");
  const from      = searchParams.get("from");
  const to        = searchParams.get("to");
  const search    = searchParams.get("search");
  const limit     = parseInt(searchParams.get("limit") || "50", 10);
  const offset    = parseInt(searchParams.get("offset") || "0", 10);

  const where = {
    profileId,
    ...(accountId && { accountId: Number(accountId) }),
    ...(category  && { category }),
    ...(type      && { type }),
    ...(from || to ? { date: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
    ...(search && { description: { contains: search, mode: "insensitive" } }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
      include: { account: { select: { id: true, name: true, bankName: true, color: true } } },
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, limit, offset });
}
