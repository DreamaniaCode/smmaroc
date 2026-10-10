import { db } from "../src/lib/db";
import { ensureInitialAdmin } from "../src/lib/auth";

async function main() {
  console.log("Checking and seeding database...");
  await ensureInitialAdmin();

  // Create a sample client
  const clientCount = await db.client.count();
  if (clientCount === 0) {
    await db.client.create({
      data: {
        name: "Acme Agency Client",
        email: "contact@acme.com",
        notes: "Primary test client for automated campaigns",
      },
    });
    console.log("Created sample client: Acme Agency Client");
  }

  // Create sample service categories
  const serviceCount = await db.service.findMany();
  if (serviceCount.length === 0) {
    // Add sample provider
    const sampleProvider = await db.provider.create({
      data: {
        name: "JustAnotherPanel (Primary)",
        apiUrl: "https://justanotherpanel.com/api/v2",
        apiKey: "demo_api_key_replace_in_dashboard",
        balance: 154.20,
        currency: "USD",
        lowBalanceLimit: 25.0,
      },
    });

    const backupProvider = await db.provider.create({
      data: {
        name: "SMMKings (Backup)",
        apiUrl: "https://smmkings.com/api/v2",
        apiKey: "demo_backup_api_key",
        balance: 82.50,
        currency: "USD",
        lowBalanceLimit: 20.0,
      },
    });

    // Add sample mapped service with auto-failover
    await db.service.create({
      data: {
        name: "Instagram Followers [High Quality - Non Drop]",
        category: "Instagram",
        minQuantity: 50,
        maxQuantity: 50000,
        ratePer1000: 2.50,
        dripFeedAllowed: true,
        mapping: {
          create: {
            primaryProviderId: sampleProvider.id,
            primaryServiceId: "1024",
            backupProviderId: backupProvider.id,
            backupServiceId: "842",
            autoFailover: true,
          },
        },
      },
    });

    await db.service.create({
      data: {
        name: "YouTube Views [Fast Speed - High Retention]",
        category: "YouTube",
        minQuantity: 100,
        maxQuantity: 1000000,
        ratePer1000: 1.80,
        dripFeedAllowed: true,
        mapping: {
          create: {
            primaryProviderId: sampleProvider.id,
            primaryServiceId: "2048",
            backupProviderId: backupProvider.id,
            backupServiceId: "1910",
            autoFailover: true,
          },
        },
      },
    });

    console.log("Seeded sample providers and mapped services with auto-failover!");
  }

  console.log("Database initialized successfully!");
}

main().catch(console.error);
