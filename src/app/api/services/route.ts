import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("smm_session")?.value;
    const session = token ? await verifySessionToken(token) : null;
    const services = await db.service.findMany(session?.role === "ADMIN" ? {
      orderBy: { category: "asc" },
      include: { mapping: { include: {
        primaryProvider: { select: { id: true, name: true, balance: true, currency: true } },
        backupProvider: { select: { id: true, name: true, balance: true, currency: true } },
      } } },
    } : {
      orderBy: { category: "asc" },
      select: { id: true, name: true, category: true, minQuantity: true, maxQuantity: true, sellingRatePer1000: true, dripFeedAllowed: true },
    });
    return NextResponse.json({ services }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("[catalog] Database request failed", { code: error.code || error.name });
    return NextResponse.json({ error: "Le catalogue est temporairement indisponible. Veuillez réessayer dans quelques instants." }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "10" } });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can configure services" }, { status: 403 });
  }

  try {
    const {
      name,
      category,
      minQuantity,
      maxQuantity,
      ratePer1000,
      dripFeedAllowed,
      primaryProviderId,
      primaryServiceId,
      backupProviderId,
      backupServiceId,
      autoFailover,
    } = await req.json();

    if (!name || !primaryProviderId || !primaryServiceId) {
      return NextResponse.json(
        { error: "Name, Primary Provider, and Primary Service ID are required" },
        { status: 400 }
      );
    }

    const service = await db.service.create({
      data: {
        name,
        category: category || "General",
        minQuantity: parseInt(minQuantity || "10", 10),
        maxQuantity: parseInt(maxQuantity || "100000", 10),
        ratePer1000: parseFloat(ratePer1000 || "0.0"),
        dripFeedAllowed: Boolean(dripFeedAllowed),
        mapping: {
          create: {
            primaryProviderId,
            primaryServiceId: String(primaryServiceId),
            backupProviderId: backupProviderId ? String(backupProviderId) : null,
            backupServiceId: backupServiceId ? String(backupServiceId) : null,
            autoFailover: autoFailover !== undefined ? Boolean(autoFailover) : true,
          },
        },
      },
      include: { mapping: true },
    });

    return NextResponse.json({ success: true, service });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create service" }, { status: 500 });
  }
}
