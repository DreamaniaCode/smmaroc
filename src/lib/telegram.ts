import axios from "axios";
import { db } from "./db";

/**
 * Retrieves the Telegram credentials either from environment or AppSetting table
 */
async function getTelegramConfig() {
  const tokenSetting = await db.appSetting.findUnique({ where: { key: "TELEGRAM_BOT_TOKEN" } });
  const chatSetting = await db.appSetting.findUnique({ where: { key: "TELEGRAM_CHAT_ID" } });

  const token = tokenSetting?.value || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = chatSetting?.value || process.env.TELEGRAM_CHAT_ID || "";

  return { token: token.trim(), chatId: chatId.trim() };
}

/**
 * Sends a raw markdown message to the configured Telegram chat
 */
export async function sendTelegramAlert(message: string): Promise<boolean> {
  const { token, chatId } = await getTelegramConfig();
  if (!token || !chatId) {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    return true;
  } catch (error: any) {
    console.error("[TELEGRAM ALERT ERROR]", error.response?.data || error.message);
    return false;
  }
}

/**
 * Alert: Low balance on an upstream provider
 */
export async function alertLowBalance(
  providerName: string,
  balance: number,
  limit: number,
  currency: string
) {
  const text = `
⚠️ <b>SMM ALERT: Low Provider Balance</b>
━━━━━━━━━━━━━━━━━━
<b>Provider:</b> ${providerName}
<b>Current Balance:</b> ${balance.toFixed(2)} ${currency}
<b>Threshold:</b> ${limit.toFixed(2)} ${currency}

Please refill your provider balance to prevent order dispatch failures.
`.trim();

  await sendTelegramAlert(text);
}

/**
 * Alert: Smart Failover Triggered
 */
export async function alertFailoverTriggered(params: {
  orderId: string;
  clientName?: string;
  serviceName: string;
  primaryProvider: string;
  backupProvider: string;
  reason: string;
}) {
  const text = `
🔄 <b>SMM ALERT: Smart Failover Triggered</b>
━━━━━━━━━━━━━━━━━━
<b>Order ID:</b> <code>${params.orderId}</code>
<b>Client:</b> ${params.clientName || "General / Unassigned"}
<b>Service:</b> ${params.serviceName}
<b>From:</b> ${params.primaryProvider}
<b>Rerouted To:</b> ${params.backupProvider}
<b>Reason:</b> ${params.reason}

<i>Order was automatically resubmitted to the backup provider without manual intervention.</i>
`.trim();

  await sendTelegramAlert(text);
}

/**
 * Alert: Critical Order Failure
 */
export async function alertOrderFailed(params: {
  orderId: string;
  clientName?: string;
  serviceName: string;
  provider: string;
  reason: string;
}) {
  const text = `
❌ <b>SMM ALERT: Order Execution Failed</b>
━━━━━━━━━━━━━━━━━━
<b>Order ID:</b> <code>${params.orderId}</code>
<b>Client:</b> ${params.clientName || "General"}
<b>Service:</b> ${params.serviceName}
<b>Provider:</b> ${params.provider}
<b>Error:</b> ${params.reason}

<i>No automatic failover available or backup also failed. Please review in the dashboard.</i>
`.trim();

  await sendTelegramAlert(text);
}

/**
 * Daily Agency Operations Digest
 */
export async function sendDailyAgencyDigest(stats: {
  completedOrders: number;
  activeOrders: number;
  failedOrders: number;
  totalWholesaleSpend: number;
  activeClients: number;
}) {
  const text = `
📊 <b>DAILY SMM OPERATIONS DIGEST</b>
━━━━━━━━━━━━━━━━━━
✅ <b>Completed Orders (24h):</b> ${stats.completedOrders}
⏳ <b>Active In Progress:</b> ${stats.activeOrders}
❌ <b>Failed / Issues:</b> ${stats.failedOrders}
💰 <b>Wholesale Spend:</b> $${stats.totalWholesaleSpend.toFixed(2)}
👥 <b>Active Clients:</b> ${stats.activeClients}

<i>System running smoothly on Coolify Cloud.</i>
`.trim();

  await sendTelegramAlert(text);
}
