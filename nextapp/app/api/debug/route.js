import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlStart: process.env.DATABASE_URL?.slice(0, 30) ?? "MISSING",
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}
