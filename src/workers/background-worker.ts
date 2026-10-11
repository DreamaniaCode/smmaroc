import "dotenv/config";
import { db } from "../lib/db";
import { SmmClient } from "../lib/smm-client";
import { attemptOrderFailover } from "../lib/failover";
import { alertLowBalance, sendDailyAgencyDigest } from "../lib/telegram";
import { pollGoogleSheetForNewOrders, updateSheetOrderRow } from "../lib/google-sheets";

console.log("=========================================");
console.log("  🚀 SMM Agency Panel - Automation Worker");
console.log("=========================================");

/**
 * 1. Synchronize order statuses from upstream providers
 */
async function syncOrderStatuses() {
  try {
    const activeOrders = await db.order.findMany({
      where: {
        status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] },
        providerOrderId: { not: null },
        currentProviderId: { not: null },
      },
      include: {
        currentProvider: true,
      },
      take: 100,
    });

    if (activeOrders.length === 0) return;

    console.log(`[STATUS SYNC] Checking ${activeOrders.length} active orders...`);

    // Group by provider
    const ordersByProvider = new Map<string, typeof activeOrders>();
    for (const order of activeOrders) {
      const pid = order.currentProviderId!;
      const list = ordersByProvider.get(pid) || [];
      list.push(order);
      ordersByProvider.set(pid, list);
    }

    for (const [providerId, orders] of ordersByProvider.entries()) {
      const provider = orders[0].currentProvider;
      if (!provider) continue;

      const client = new SmmClient(provider.apiUrl, provider.apiKey);

      for (const order of orders) {
        try {
          const statusResult = await client.getStatus(order.providerOrderId!);
          const providerStatus = (statusResult.status || "").toLowerCase();

          let newStatus = order.status;
          const startCount = statusResult.start_count != null ? parseInt(String(statusResult.start_count), 10) : order.startCount;
          const remains = statusResult.remains != null ? parseInt(String(statusResult.remains), 10) : order.remains;

          if (providerStatus.includes("completed")) {
            newStatus = "COMPLETED";
          } else if (providerStatus.includes("progress")) {
            newStatus = "IN_PROGRESS";
          } else if (providerStatus.includes("processing") || providerStatus.includes("pending")) {
            newStatus = "PROCESSING";
          } else if (providerStatus.includes("partial")) {
            newStatus = "PARTIAL";
          } else if (providerStatus.includes("cancel") || providerStatus.includes("refund")) {
            // TRIGGER SMART FAILOVER
            console.log(`[FAILOVER TRIGGER] Order #${order.id} canceled by ${provider.name}. Attempting failover...`);
            await attemptOrderFailover(order.id, `Provider status: ${statusResult.status}`);
            continue;
          }

          if (newStatus !== order.status || startCount !== order.startCount || remains !== order.remains) {
            await db.order.update({
              where: { id: order.id },
              data: {
                status: newStatus,
                startCount,
                remains,
              },
            });

            // Sync back to Google Sheet if linked
            if (order.sheetRowIndex) {
              await updateSheetOrderRow(order.sheetRowIndex, newStatus, startCount, remains);
            }
          }
        } catch (err: any) {
          console.error(`[SYNC ERROR for Order ${order.id}]`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("[CRON ERROR: syncOrderStatuses]", err);
  }
}

/**
 * 2. Monitor provider account balances & trigger low-balance alerts
 */
async function monitorProviderBalances() {
  try {
    const providers = await db.provider.findMany({
      where: { isActive: true },
    });

    for (const provider of providers) {
      try {
        const client = new SmmClient(provider.apiUrl, provider.apiKey);
        const { balance, currency } = await client.getBalance();

        await db.provider.update({
          where: { id: provider.id },
          data: {
            balance,
            currency,
            lastCheckedAt: new Date(),
          },
        });

        // Trigger alert if below threshold
        if (balance < provider.lowBalanceLimit) {
          console.warn(`[BALANCE ALERT] ${provider.name} balance (${balance} ${currency}) is below limit (${provider.lowBalanceLimit})!`);
          await alertLowBalance(provider.name, balance, provider.lowBalanceLimit, currency);
        }
      } catch (err: any) {
        console.error(`[BALANCE CHECK FAILED for ${provider.name}]`, err.message);
      }
    }
  } catch (err) {
    console.error("[CRON ERROR: monitorProviderBalances]", err);
  }
}

/**
 * 3. Daily operations summary
 */
async function checkDailyDigest() {
  const now = new Date();
  // Fire once per day around 09:00 AM
  if (now.getHours() === 9 && now.getMinutes() < 10) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const completedOrders = await db.order.count({
      where: { status: "COMPLETED", updatedAt: { gte: yesterday } },
    });
    const activeOrders = await db.order.count({
      where: { status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] } },
    });
    const failedOrders = await db.order.count({
      where: { status: "FAILED", updatedAt: { gte: yesterday } },
    });
    const activeClients = await db.client.count();

    const spendAggregate = await db.order.aggregate({
      where: { createdAt: { gte: yesterday } },
      _sum: { charge: true },
    });

    await sendDailyAgencyDigest({
      completedOrders,
      activeOrders,
      failedOrders,
      totalWholesaleSpend: spendAggregate._sum.charge || 0,
      activeClients,
    });
  }
}

// Main execution loop
async function startWorker() {
  console.log("[WORKER] Worker initialized. Starting polling timers...");

  // Run initial checks
  await syncOrderStatuses();
  await monitorProviderBalances();
  await pollGoogleSheetForNewOrders();

  // Schedule intervals
  // Order status sync: every 60 seconds
  setInterval(syncOrderStatuses, 60 * 1000);

  // Google Sheets intake sync: every 2 minutes
  setInterval(pollGoogleSheetForNewOrders, 2 * 60 * 1000);

  // Provider balance monitor: every 30 minutes
  setInterval(monitorProviderBalances, 30 * 60 * 1000);

  // Daily digest check: every 10 minutes
  setInterval(checkDailyDigest, 10 * 60 * 1000);
}

startWorker().catch((err) => {
  console.error("[WORKER FATAL CRASH]", err);
  process.exit(1);
});
