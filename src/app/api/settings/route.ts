import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { sendTelegramAlert } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.appSetting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    // Mask sensitive secrets if operator
    if (session.role !== "ADMIN" && (s.key.includes("TOKEN") || s.key.includes("CREDENTIALS"))) {
      settingsMap[s.key] = "••••••••";
    } else {
      settingsMap[s.key] = s.value;
    }
  }

  return NextResponse.json({ settings: settingsMap, role: session.role });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can change settings" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, value, testTelegram } = body;

    if (testTelegram) {
      const ok = await sendTelegramAlert("🚀 <b>SMM Panel:</b> Telegram notification test successful!");
      return NextResponse.json({ success: ok, tested: true });
    }

    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 });
    }

    await db.appSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({ success: true, key, value });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update setting" }, { status: 500 });
  }
}
