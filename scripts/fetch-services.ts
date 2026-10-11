import { SmmClient } from "../src/lib/smm-client";

async function main() {
  console.log("Fetching services from JustAnotherPanel...");
  const jap = new SmmClient("https://justanotherpanel.com/api/v2", "1b23074f10a91edb67c3f2b37ea91de4");
  try {
    const japServices = await jap.getServices();
    console.log(`✅ JustAnotherPanel returned ${japServices.length} total services.`);
    const sampleJap = japServices.slice(0, 3).map((s) => ({
      id: s.service,
      name: s.name,
      rate: s.rate,
      min: s.min,
      max: s.max,
    }));
    console.log("Sample JAP services:", sampleJap);
  } catch (err: any) {
    console.error("JAP Error:", err.message);
  }

  console.log("\nFetching services from SMMKings...");
  const kings = new SmmClient("https://smmkings.com/api/v2", "26635ed2d3c3fc39d0a4fb0d43ec1b03");
  try {
    const kingsServices = await kings.getServices();
    console.log(`✅ SMMKings returned ${kingsServices.length} total services.`);
    const sampleKings = kingsServices.slice(0, 3).map((s) => ({
      id: s.service,
      name: s.name,
      rate: s.rate,
      min: s.min,
      max: s.max,
    }));
    console.log("Sample SMMKings services:", sampleKings);
  } catch (err: any) {
    console.error("SMMKings Error:", err.message);
  }
}

main().catch(console.error);
