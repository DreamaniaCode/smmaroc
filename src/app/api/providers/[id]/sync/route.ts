import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { importServices } from "@/lib/sync-services";
import { SmmClient } from "@/lib/smm-client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const provider = await db.provider.findUnique({ where: { id } });
  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  try {
    const client = new SmmClient(provider.apiUrl, provider.apiKey);
    const services = await client.getServices();
    const balanceData = await client.getBalance().catch(() => ({ balance: provider.balance, currency: provider.currency }));
    const imported = await importServices(provider, services);

    const updated = await db.provider.update({
      where: { id },
      data: {
        balance: balanceData.balance,
        currency: balanceData.currency,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      balance: updated.balance,
      currency: updated.currency,
      servicesCount: services.length,
      imported,
      sampleServices: services,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Sync failed" }, { status: 500 });
  }
}
