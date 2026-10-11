import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "USER") return NextResponse.json({ clients: [] });
  const clients = await db.client.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (session.role === "USER") return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    const { name, email, notes } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const client = await db.client.create({
      data: { name: name.trim(), email: email?.trim(), notes },
    });

    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create client" }, { status: 500 });
  }
}
