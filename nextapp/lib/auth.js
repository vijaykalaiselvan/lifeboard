import jwt from "jsonwebtoken";
import prisma from "./prisma.js";
import { NextResponse } from "next/server";

export function getUserId(request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return payload.userId;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
}

export async function getProfileId(request, userId) {
  const profileId = Number(request.headers.get("x-profile-id"));
  if (!profileId || isNaN(profileId)) return null;
  const profile = await prisma.profile.findFirst({ where: { id: profileId, userId } });
  return profile ? profileId : null;
}

export function badRequest(msg) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export function forbidden() {
  return NextResponse.json({ error: "Profile not found or access denied" }, { status: 403 });
}
