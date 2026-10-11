import "dotenv/config";
import { db } from "../src/lib/db";
import { sellingPrice } from "../src/lib/pricing";
async function main() {
 const services = await db.service.findMany();
 for (const s of services) {
  await db.service.update({ where: { id: s.id }, data: { sellingRatePer1000: sellingPrice(s.ratePer1000, s.mapping?.primaryProvider?.currency) } });
 }
 console.log(`Updated ${services.length} services: supplier cost +80%, fixed currency conversion.`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
