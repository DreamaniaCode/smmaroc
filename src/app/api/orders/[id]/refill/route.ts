import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { SmmClient } from "@/lib/smm-client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { currentProvider: true },
  });

  if (!order || !order.currentProvider || !order.providerOrderId) {
    return NextResponse.json({ error: "Order or provider not found" }, { status: 404 });
  }

  try {
    const client = new SmmClient(order.currentProvider.apiUrl, order.currentProvider.apiKey);
    const refillRes = await client.refill(order.providerOrderId);
    return NextResponse.json({ success: true, refill: refillRes.refill });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Refill request failed" }, { status: 500 });
  }
}
