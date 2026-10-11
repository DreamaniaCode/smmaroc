import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { SmmClient, SupplierBalanceError } from "@/lib/smm-client";
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

  // Role isolation: customers only see their own orders
  if (session.role === "USER") {
    where.userId = session.userId;
  }

  if (session.role === "ADMIN" && searchParams.get("userId")) where.userId = searchParams.get("userId");

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
      service: { select: { id: true, name: true, category: true, sellingRatePer1000: true } },
      currentProvider: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ orders: session.role === "ADMIN" ? orders : orders.map(({currentProvider, currentProviderId, providerOrderId, failoverAttempted, failoverReason, charge, ...order}: any) => order) });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

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
        errors.push({ link: item.link, error: `Service ID ${item.serviceId} is not available` });
        continue;
      }

      if (!Number.isInteger(item.quantity) || item.quantity < service.minQuantity || item.quantity > service.maxQuantity || !/^https?:\/\//i.test(item.link)) { errors.push({ link: item.link, error: "Invalid link or quantity outside service limits" }); continue; }
      // Check balance if regular user
      const customerCost = (item.quantity / 1000) * service.sellingRatePer1000;
      const liveUser = await db.user.findUnique({ where: { id: user.id } });
      const currentBalance = liveUser.balance;

      if (user.role === "USER" && currentBalance < customerCost) {
        errors.push({
          link: item.link,
          error: `Insufficient wallet balance. Cost: ${customerCost.toFixed(2)} ${user.currency}, Available: ${currentBalance.toFixed(2)} ${user.currency}`,
        });
        continue;
      }

      // Deduct customer wallet
      if (user.role === "USER") {
        const debit = await db.debitWallet(user.id, customerCost);
        if (!debit) { errors.push({ link: item.link, error: "Insufficient wallet balance" }); continue; }
      }

      const mapping = service.mapping;
      let assignedProviderId = mapping.primaryProviderId;
      let providerOrderId: string | null = null;
      let initialStatus = "PROCESSING";
      let failoverAttempted = false;
      let failoverReason: string | null = null;

      try {
        const client = new SmmClient(mapping.primaryProvider.apiUrl, mapping.primaryProvider.apiKey);
        const res = await client.addOrder({
          service: mapping.primaryServiceId,
          ratePer1000: service.ratePer1000,
          link: item.link,
          quantity: item.quantity,
          runs: item.runs,
          interval: item.intervalMinutes,
        });
        providerOrderId = res.order;
      } catch (primaryErr: any) {
        if (primaryErr instanceof SupplierBalanceError) {
          initialStatus = "AWAITING_FUNDS";
          failoverReason = "En attente de traitement";
        } else if (mapping.autoFailover && mapping.backupProvider && mapping.backupServiceId) {
          try {
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

            await alertFailoverTriggered({
              orderId: "Commercial Order",
              clientName: user.name,
              serviceName: service.name,
              primaryProvider: mapping.primaryProvider.name,
              backupProvider: mapping.backupProvider.name,
              reason: primaryErr.message,
            }).catch(() => {});
          } catch (backupErr: any) {
            initialStatus = "FAILED";
            failoverAttempted = true;
            failoverReason = `Primary failed: ${primaryErr.message} | Backup failed: ${backupErr.message}`;
            await alertOrderFailed({
              orderId: "Order",
              clientName: user.name,
              serviceName: service.name,
              provider: `${mapping.primaryProvider.name} & ${mapping.backupProvider.name}`,
              reason: failoverReason,
            }).catch(() => {});
          }
        } else {
          initialStatus = "FAILED";
          failoverReason = `Primary provider error: ${primaryErr.message}`;
          await alertOrderFailed({
            orderId: "Order",
            clientName: user.name,
            serviceName: service.name,
            provider: mapping.primaryProvider.name,
            reason: primaryErr.message,
          }).catch(() => {});
        }
      }

      if (initialStatus === "FAILED" && user.role === "USER") await db.creditWallet(user.id, customerCost);
      const order = await db.order.create({
        data: {
          userId: user.id,
          clientId: user.role === "USER" ? null : item.clientId || null,
          serviceId: service.id,
          link: item.link,
          quantity: item.quantity,
          runs: item.runs || 1,
          intervalMinutes: item.intervalMinutes || 0,
          customerCost,
          currentProviderId: assignedProviderId,
          providerOrderId,
          status: initialStatus,
          failoverAttempted,
          failoverReason,
          source: type === "MASS" ? "MASS" : "MANUAL",
        },
      });

      if (initialStatus === "FAILED") errors.push({ link: item.link, error: failoverReason || "Provider rejected order; wallet refunded" });
      else createdOrders.push(user.role === "ADMIN" ? order : { id: order.id, status: order.status, quantity: order.quantity, customerCost: order.customerCost, createdAt: order.createdAt });
    }

    return NextResponse.json({
      success: createdOrders.length > 0,
      count: createdOrders.length,
      orders: createdOrders,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Order placement failed" }, { status: 500 });
  }
}
