import { db } from "./db";
import { SmmClient } from "./smm-client";
import { alertFailoverTriggered, alertOrderFailed } from "./telegram";

export async function attemptOrderFailover(orderId: string, failureReason: string): Promise<boolean> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      client: true,
      service: {
        include: {
          mapping: {
            include: {
              primaryProvider: true,
              backupProvider: true,
            },
          },
        },
      },
      currentProvider: true,
    },
  });

  if (!order || !order.service.mapping) {
    return false;
  }

  const mapping = order.service.mapping;

  // If failover is not enabled or backup provider is not configured or already tried failover
  if (!mapping.autoFailover || !mapping.backupProvider || !mapping.backupServiceId || order.failoverAttempted) {
    await db.order.update({
      where: { id: order.id },
      data: {status: "FAILED",
      failoverReason: `Provider reported failure: ${failureReason}. No eligible backup failover.`},
    } as any);

    await alertOrderFailed({
      orderId: order.id,
      clientName: order.client?.name,
      serviceName: order.service.name,
      provider: order.currentProvider?.name || "Unknown",
      reason: failureReason,
    });

    return false;
  }

  // Attempt dispatch to backup provider
  try {
    const backupClient = new SmmClient(
      mapping.backupProvider.apiUrl,
      mapping.backupProvider.apiKey
    );

    const result = await backupClient.addOrder({
      service: mapping.backupServiceId,
      link: order.link,
      quantity: order.quantity,
      runs: order.runs,
      interval: order.intervalMinutes,
    });

    await db.order.update({
      where: { id: order.id },
      data: {
        currentProviderId: mapping.backupProvider.id,
        providerOrderId: result.order,
        status: "PROCESSING",
        failoverAttempted: true,
        failoverReason: `Auto-rerouted from ${order.currentProvider?.name || "Primary"} due to: ${failureReason}`,
      },
    });

    await alertFailoverTriggered({
      orderId: order.id,
      clientName: order.client?.name,
      serviceName: order.service.name,
      primaryProvider: order.currentProvider?.name || "Primary Provider",
      backupProvider: mapping.backupProvider.name,
      reason: failureReason,
    });

    return true;
  } catch (backupError: any) {
    const errMsg = backupError.message || "Failed dispatching to backup provider";
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "FAILED",
        failoverAttempted: true,
        failoverReason: `Primary failed (${failureReason}). Backup also failed (${errMsg}).`,
      },
    });

    await alertOrderFailed({
      orderId: order.id,
      clientName: order.client?.name,
      serviceName: order.service.name,
      provider: `${mapping.backupProvider.name} (Backup)`,
      reason: `Primary failed: ${failureReason}. Backup failed: ${errMsg}`,
    });

    return false;
  }
}
