import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, unauthorized, badRequest } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profiles = await prisma.profile.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(profiles);
}

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const { name } = await request.json();
  if (!name?.trim()) return badRequest("name is required");
  const profile = await prisma.profile.create({ data: { userId, name: name.trim() } });
  return NextResponse.json(profile, { status: 201 });
}
