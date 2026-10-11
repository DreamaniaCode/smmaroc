import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { SmmClient } from "@/lib/smm-client";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "USER") return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
  const providers = await db.provider.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true, primaryMappings: true, backupMappings: true } },
    },
  });

  // Mask API keys for Operators
  const safeProviders = providers.map((p) => ({
    ...p,
    apiKey: session.role === "ADMIN" ? p.apiKey : "••••••••••••••••",
  }));

  return NextResponse.json({ providers: safeProviders });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can manage providers" }, { status: 403 });
  }

  try {
    const { name, apiUrl, apiKey, lowBalanceLimit } = await req.json();

    if (!name || !apiUrl || !apiKey) {
      return NextResponse.json({ error: "Name, API URL, and API Key are required" }, { status: 400 });
    }

    // Test API connection and fetch initial balance
    const client = new SmmClient(apiUrl, apiKey);
    let balance = 0;
    let currency = "USD";
    try {
      const balanceData = await client.getBalance();
      balance = balanceData.balance;
      currency = balanceData.currency;
    } catch (testErr: any) {
      console.warn(`[PROVIDER TEST WARNING] Could not fetch balance: ${testErr.message}`);
    }

    const provider = await db.provider.create({
      data: {
        name,
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim(),
        balance,
        currency,
        lowBalanceLimit: lowBalanceLimit ? parseFloat(lowBalanceLimit) : 20.0,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, provider });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create provider" }, { status: 500 });
  }
}
