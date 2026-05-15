import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, unauthorized } from "@/lib/auth";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return NextResponse.json(user);
}
