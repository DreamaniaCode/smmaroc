import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { SmmClient } from "@/lib/smm-client";
import { alertFailoverTriggered, alertOrderFailed } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const search = searchParams.get("search");

  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (clientId && clientId !== "ALL") where.clientId = clientId;
  if (search) {
    where.OR = [
      { link: { contains: search } },
      { id: { contains: search } },
      { providerOrderId: { contains: search } },
    ];
  }

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      client: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, category: true } },
      currentProvider: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type } = body; // "SINGLE" | "MASS"

    const orderItems: Array<{
      serviceId: string;
      link: string;
      quantity: number;
      clientId?: string;
      runs?: number;
      intervalMinutes?: number;
    }> = [];

    if (type === "MASS") {
      // Input format: lines of "service_id | link | quantity"
      const { rawText, clientId } = body;
      const lines = (rawText || "").split("\n");
      for (const line of lines) {
        const parts = line.split("|").map((p: string) => p.trim());
        if (parts.length >= 3) {
          const serviceId = parts[0];
          const link = parts[1];
          const quantity = parseInt(parts[2], 10);
          if (serviceId && link && quantity > 0) {
            orderItems.push({ serviceId, link, quantity, clientId });
          }
        }
      }
    } else {
      // Single order
      const { serviceId, link, quantity, clientId, runs, intervalMinutes } = body;
      if (!serviceId || !link || !quantity) {
        return NextResponse.json({ error: "Missing required order parameters" }, { status: 400 });
      }
      orderItems.push({
        serviceId,
        link,
        quantity: parseInt(quantity, 10),
        clientId,
        runs: runs ? parseInt(runs, 10) : 1,
        intervalMinutes: intervalMinutes ? parseInt(intervalMinutes, 10) : 0,
      });
    }

    if (orderItems.length === 0) {
      return NextResponse.json({ error: "No valid orders found to submit" }, { status: 400 });
    }

    const createdOrders = [];
    const errors = [];

    for (const item of orderItems) {
      const service = await db.service.findUnique({
        where: { id: item.serviceId },
        include: {
          mapping: {
            include: {
              primaryProvider: true,
              backupProvider: true,
            },
          },
        },
      });

      if (!service || !service.mapping) {
        errors.push({ link: item.link, error: `Service ID ${item.serviceId} has no provider mapping` });
        continue;
      }

      const mapping = service.mapping;
      let assignedProviderId = mapping.primaryProviderId;
      let providerOrderId: string | null = null;
      let initialStatus = "PROCESSING";
      let failoverAttempted = false;
      let failoverReason: string | null = null;

      // 1. Attempt primary provider dispatch
      try {
        const client = new SmmClient(mapping.primaryProvider.apiUrl, mapping.primaryProvider.apiKey);
        const res = await client.addOrder({
          service: mapping.primaryServiceId,
          link: item.link,
          quantity: item.quantity,
          runs: item.runs,
          interval: item.intervalMinutes,
        });
        providerOrderId = res.order;
      } catch (primaryErr: any) {
        // 2. Primary failed! Check if smart failover is configured
        if (mapping.autoFailover && mapping.backupProvider && mapping.backupServiceId) {
          try {
            console.log(`[DISPATCH FAILOVER] Primary failed: ${primaryErr.message}. Routing to backup provider ${mapping.backupProvider.name}...`);
            const backupClient = new SmmClient(mapping.backupProvider.apiUrl, mapping.backupProvider.apiKey);
            const backupRes = await backupClient.addOrder({
              service: mapping.backupServiceId,
              link: item.link,
              quantity: item.quantity,
              runs: item.runs,
              interval: item.intervalMinutes,
            });
            assignedProviderId = mapping.backupProvider.id;
            providerOrderId = backupRes.order;
            failoverAttempted = true;
            failoverReason = `Primary provider rejected dispatch: ${primaryErr.message}`;

            // Trigger telegram alert
            await alertFailoverTriggered({
              orderId: "New Order",
              clientName: item.clientId,
              serviceName: service.name,
              primaryProvider: mapping.primaryProvider.name,
              backupProvider: mapping.backupProvider.name,
              reason: primaryErr.message,
            });
          } catch (backupErr: any) {
            initialStatus = "FAILED";
            failoverAttempted = true;
            failoverReason = `Primary failed: ${primaryErr.message} | Backup failed: ${backupErr.message}`;
            await alertOrderFailed({
              orderId: "New Order",
              clientName: item.clientId,
              serviceName: service.name,
              provider: `${mapping.primaryProvider.name} & ${mapping.backupProvider.name}`,
              reason: failoverReason,
            });
          }
        } else {
          initialStatus = "FAILED";
          failoverReason = `Primary provider error: ${primaryErr.message}`;
          await alertOrderFailed({
            orderId: "New Order",
            clientName: item.clientId,
            serviceName: service.name,
            provider: mapping.primaryProvider.name,
            reason: primaryErr.message,
          });
        }
      }

      const order = await db.order.create({
        data: {
          clientId: item.clientId || null,
          serviceId: service.id,
          link: item.link,
          quantity: item.quantity,
          runs: item.runs || 1,
          intervalMinutes: item.intervalMinutes || 0,
          currentProviderId: assignedProviderId,
          providerOrderId,
          status: initialStatus,
          failoverAttempted,
          failoverReason,
          source: type === "MASS" ? "MASS" : "MANUAL",
        },
        include: {
          client: true,
          service: true,
          currentProvider: true,
        },
      });

      createdOrders.push(order);
    }

    return NextResponse.json({
      success: true,
      count: createdOrders.length,
      orders: createdOrders,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Order placement failed" }, { status: 500 });
  }
}
