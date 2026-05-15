import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const { email, password } = await request.json();
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profiles: { orderBy: { createdAt: "asc" } } },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
    profiles: user.profiles,
  });
}
