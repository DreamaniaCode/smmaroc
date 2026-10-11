import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { sendTelegramAlert } from "@/lib/telegram";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can approve deposits" }, { status: 403 });
  }

  const { id } = await params;
  const deposit = await db.deposit.findUnique({ where: { id } });
  if (!deposit) {
    return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
  }

  try {
    const { status, adminNotes } = await req.json();

    if (status === "APPROVED" && deposit.status !== "APPROVED") {
      // Credit customer wallet balance!
      const user = await db.user.findUnique({ where: { id: deposit.userId } });
      if (user) {
        const newBalance = (user.balance || 0.0) + deposit.amount;
        await db.user.update({
          where: { id: user.id },
          data: { balance: newBalance },
        });
      }

      await sendTelegramAlert(`
✅ <b>SMMaroc Deposit Approved</b>
━━━━━━━━━━━━━━━━━━
<b>Deposit ID:</b> <code>${deposit.id.slice(0, 8)}</code>
<b>User:</b> ${deposit.user?.name || "Client"}
<b>Amount Credited:</b> +${deposit.amount} ${deposit.currency}
`.trim());
    }

    const updated = await db.deposit.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || deposit.adminNotes,
      },
    });

    return NextResponse.json({ success: true, deposit: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update deposit" }, { status: 500 });
  }
}
