import { db } from "../src/lib/db";

async function main() {
  const services = await db.service.findMany();
  for (const s of services) {
    const rate = s.ratePer1000 || 2.0;
    const retailRate = Math.max(15, Math.round(rate * 1.5 * 10));
    await db.service.update({
      where: { id: s.id },
      data: { sellingRatePer1000: retailRate },
    });
    console.log(`Updated "${s.name}": Wholesale $${rate} -> Retail ${retailRate} MAD`);
  }
}

main().catch(console.error);
