import { sellingPrice } from "./pricing";
import { db } from "./db";
import { SmmServiceItem } from "./smm-client";
export async function importServices(provider: { id: string; currency: string }, services: SmmServiceItem[]) {
 const id = provider.id;
    let imported = 0;
    for (const upstream of services) {
      const upstreamId = String(upstream.service);
      const min = Number(upstream.min ?? 10);
      const max = Number(upstream.max ?? 100000);
      const rate = Number(upstream.rate ?? 0);
      if (!upstreamId || !upstream.name || !Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || !Number.isFinite(rate) || rate < 0) continue;
      const existing = await db.serviceMapping.findFirst({ where: { primaryProviderId: id, primaryServiceId: upstreamId } });
      const data = { name: upstream.name, category: upstream.category || "General", minQuantity: min, maxQuantity: max, ratePer1000: rate, sellingRatePer1000: sellingPrice(rate, provider.currency) };
      if (existing) await db.service.update({ where: { id: existing.serviceId }, data });
      else await db.service.create({ data: { ...data, mapping: { create: { primaryProviderId: id, primaryServiceId: upstreamId, autoFailover: false } } } });
      imported++;
    }


 return imported;
}
