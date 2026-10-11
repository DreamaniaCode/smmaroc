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

  const where: any = {};
  if (session.role === "USER") {
    where.userId = session.userId;
  }

  const deposits = await db.deposit.findMany({ where, take: 50 });
  return NextResponse.json({ deposits });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount, currency, method, reference } = await req.json();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid deposit amount" },
        { status: 400 }
      );
    }

    if (!method) {
      return NextResponse.json(
        { error: "Please select a payment method" },
        { status: 400 }
      );
    }

    const deposit = await db.deposit.create({
      data: {
        userId: session.userId,
        amount: parsedAmount,
        currency: currency || "MAD",
        method,
        reference: reference ? String(reference).trim() : null,
        status: "PENDING",
      },
    });

    // Send Telegram alert to admin about new deposit request
    await sendTelegramAlert(`
💰 <b>SMMaroc: New Deposit Submitted</b>
━━━━━━━━━━━━━━━━━━
<b>User:</b> ${session.name} (${session.email})
<b>Amount:</b> ${parsedAmount} ${currency || "MAD"}
<b>Method:</b> ${method}
<b>Reference:</b> <code>${reference || "None provided"}</code>

<i>Please review and approve in the SMMaroc Admin Panel.</i>
`.trim());

    return NextResponse.json({ success: true, deposit });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit deposit" },
      { status: 500 }
    );
  }
}
