import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, unauthorized, badRequest } from "@/lib/auth";

export async function PUT(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const { id } = await params;
  const { name } = await request.json();
  if (!name?.trim()) return badRequest("name is required");
  await prisma.profile.updateMany({
    where: { id: Number(id), userId },
    data: { name: name.trim() },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const { id } = await params;
  const count = await prisma.profile.count({ where: { userId } });
  if (count <= 1) return badRequest("Cannot delete the last profile");
  await prisma.profile.deleteMany({ where: { id: Number(id), userId } });
  return new NextResponse(null, { status: 204 });
}
