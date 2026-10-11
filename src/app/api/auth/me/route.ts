import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const liveUser = await db.user.findUnique({
    where: { id: payload.userId },
  });

  if (!liveUser) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: liveUser.id,
      name: liveUser.name,
      email: liveUser.email,
      role: liveUser.role,
      balance: liveUser.balance || 0.0,
      currency: liveUser.currency || "MAD",
      apiKey: liveUser.apiKey,
    },
  });
}
