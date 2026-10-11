import "dotenv/config";
import { SmmClient } from "../src/lib/smm-client";
import { db } from "../src/lib/db";

async function testAndConfigure() {
  console.log("=== Testing SMM Kings API ===");
  const smmKingsClient = new SmmClient(
    "https://smmkings.com/api/v2",
    "26635ed2d3c3fc39d0a4fb0d43ec1b03"
  );
  try {
    const balKings = await smmKingsClient.getBalance();
    console.log("✅ SMMKings Connected successfully!");
    console.log("   Balance:", balKings.balance, balKings.currency);

    const existingKings = (await db.provider.findMany()).find((p) =>
      p.apiUrl.includes("smmkings")
    );
    if (existingKings) {
      await db.provider.update({
        where: { id: existingKings.id },
        data: {
          apiKey: "26635ed2d3c3fc39d0a4fb0d43ec1b03",
          balance: balKings.balance,
          currency: balKings.currency,
          lastCheckedAt: new Date(),
        },
      });
      console.log("   Updated SMMKings credentials and balance in database.");
    } else {
      await db.provider.create({
        data: {
          name: "SMMKings",
          apiUrl: "https://smmkings.com/api/v2",
          apiKey: "26635ed2d3c3fc39d0a4fb0d43ec1b03",
          balance: balKings.balance,
          currency: balKings.currency,
          lowBalanceLimit: 20.0,
        },
      });
      console.log("   Created SMMKings in database.");
    }
  } catch (err: any) {
    console.error("❌ SMMKings Error:", err.message);
  }

  console.log("\n=== Testing JustAnotherPanel API ===");
  const japClient = new SmmClient(
    "https://justanotherpanel.com/api/v2",
    "1b23074f10a91edb67c3f2b37ea91de4"
  );
  try {
    const balJap = await japClient.getBalance();
    console.log("✅ JustAnotherPanel Connected successfully!");
    console.log("   Balance:", balJap.balance, balJap.currency);

    const existingJap = (await db.provider.findMany()).find((p) =>
      p.apiUrl.includes("justanotherpanel")
    );
    if (existingJap) {
      await db.provider.update({
        where: { id: existingJap.id },
        data: {
          apiKey: "1b23074f10a91edb67c3f2b37ea91de4",
          balance: balJap.balance,
          currency: balJap.currency,
          lastCheckedAt: new Date(),
        },
      });
      console.log("   Updated JustAnotherPanel credentials and balance in database.");
    } else {
      await db.provider.create({
        data: {
          name: "JustAnotherPanel",
          apiUrl: "https://justanotherpanel.com/api/v2",
          apiKey: "1b23074f10a91edb67c3f2b37ea91de4",
          balance: balJap.balance,
          currency: balJap.currency,
          lowBalanceLimit: 25.0,
        },
      });
      console.log("   Created JustAnotherPanel in database.");
    }
  } catch (err: any) {
    console.error("❌ JustAnotherPanel Error:", err.message);
  }

  console.log("\nAll provider checks complete!");
}

testAndConfigure().catch(console.error);
