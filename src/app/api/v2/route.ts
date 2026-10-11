import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SmmClient } from "@/lib/smm-client";
import { alertFailoverTriggered, alertOrderFailed } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    let key = "";
    let action = "";
    const params: Record<string, string> = {};

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.json();
      key = json.key || "";
      action = json.action || "";
      for (const [k, v] of Object.entries(json)) {
        params[k] = String(v);
      }
    } else {
      const formData = await req.formData();
      key = (formData.get("key") as string) || "";
      action = (formData.get("action") as string) || "";
      formData.forEach((val, k) => {
        params[k] = String(val);
      });
    }

    if (!key) {
      return NextResponse.json({ error: "Missing API key (key)" }, { status: 400 });
    }

    // Authenticate user via their API key
    const user = await db.user.findUnique({ where: { apiKey: key } });
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // 1. ACTION: BALANCE
    if (action === "balance") {
      return NextResponse.json({
        balance: (user.balance || 0.0).toFixed(2),
        currency: user.currency || "MAD",
      });
    }

    // 2. ACTION: SERVICES
    if (action === "services") {
      const services = await db.service.findMany();
      const list = services.map((s) => ({
        service: s.id,
        name: s.name,
        type: "Default",
        category: s.category,
        rate: s.sellingRatePer1000.toFixed(2),
        min: s.minQuantity,
        max: s.maxQuantity,
        refill: true,
        cancel: false,
      }));
      return NextResponse.json(list);
    }

    // 3. ACTION: ADD ORDER
    if (action === "add") {
      const serviceId = params.service;
      const link = params.link;
      const quantity = parseInt(params.quantity || "0", 10);

      if (!serviceId || !link || quantity <= 0) {
        return NextResponse.json({ error: "Incorrect request parameters" }, { status: 400 });
      }

      const service = await db.service.findUnique({
        where: { id: serviceId },
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
        return NextResponse.json({ error: "Service not found or currently unavailable" }, { status: 400 });
      }

      if (quantity < service.minQuantity || quantity > service.maxQuantity) {
        return NextResponse.json(
          { error: `Quantity must be between ${service.minQuantity} and ${service.maxQuantity}` },
          { status: 400 }
        );
      }

      // Calculate cost in customer currency (e.g. MAD)
      const customerCost = (quantity / 1000) * service.sellingRatePer1000;
      if (user.role !== "ADMIN" && (user.balance || 0.0) < customerCost) {
        return NextResponse.json(
          { error: `Not enough funds on balance. Required: ${customerCost.toFixed(2)} ${user.currency}, Available: ${(user.balance || 0.0).toFixed(2)} ${user.currency}` },
          { status: 400 }
        );
      }

      // Deduct balance from customer wallet
      if (user.role !== "ADMIN") {
        await db.user.update({
          where: { id: user.id },
          data: { balance: (user.balance || 0.0) - customerCost },
        });
      }

      // Dispatch to upstream primary or backup failover
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
          link,
          quantity,
        });
        providerOrderId = res.order;
      } catch (err: any) {
        if (mapping.autoFailover && mapping.backupProvider && mapping.backupServiceId) {
          try {
            const backupClient = new SmmClient(mapping.backupProvider.apiUrl, mapping.backupProvider.apiKey);
            const bRes = await backupClient.addOrder({
              service: mapping.backupServiceId,
              link,
              quantity,
            });
            assignedProviderId = mapping.backupProvider.id;
            providerOrderId = bRes.order;
            failoverAttempted = true;
            failoverReason = `Primary provider error: ${err.message}`;

            await alertFailoverTriggered({
              orderId: "API Order",
              clientName: user.name,
              serviceName: service.name,
              primaryProvider: mapping.primaryProvider.name,
              backupProvider: mapping.backupProvider.name,
              reason: err.message,
            });
          } catch (bErr: any) {
            initialStatus = "FAILED";
            failoverAttempted = true;
            failoverReason = `Both Primary and Backup failed: ${bErr.message}`;
          }
        } else {
          initialStatus = "FAILED";
          failoverReason = err.message;
        }
      }

      const order = await db.order.create({
        data: {
          userId: user.id,
          serviceId: service.id,
          link,
          quantity,
          customerCost,
          currentProviderId: assignedProviderId,
          providerOrderId,
          status: initialStatus,
          failoverAttempted,
          failoverReason,
          source: "API",
        },
      });

      return NextResponse.json({ order: order.id });
    }

    // 4. ACTION: STATUS
    if (action === "status") {
      const orderId = params.order;
      if (!orderId) {
        return NextResponse.json({ error: "Missing order parameter" }, { status: 400 });
      }

      const order = await db.order.findUnique({ where: { id: orderId } });
      if (!order || (user.role !== "ADMIN" && order.userId !== user.id)) {
        return NextResponse.json({ error: "Incorrect order ID" }, { status: 404 });
      }

      return NextResponse.json({
        charge: (order.customerCost || 0.0).toFixed(2),
        start_count: order.startCount !== null ? String(order.startCount) : "0",
        status: order.status === "PROCESSING" ? "In progress" : order.status.charAt(0) + order.status.slice(1).toLowerCase(),
        remains: order.remains !== null ? String(order.remains) : "0",
        currency: user.currency || "MAD",
      });
    }

    // 5. ACTION: REFILL
    if (action === "refill") {
      const orderId = params.order;
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { currentProvider: true },
      });

      if (!order || (user.role !== "ADMIN" && order.userId !== user.id) || !order.currentProvider || !order.providerOrderId) {
        return NextResponse.json({ error: "Incorrect order ID" }, { status: 404 });
      }

      const client = new SmmClient(order.currentProvider.apiUrl, order.currentProvider.apiKey);
      const refillRes = await client.refill(order.providerOrderId);
      return NextResponse.json({ refill: refillRes.refill });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
