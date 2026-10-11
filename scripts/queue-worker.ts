import "dotenv/config";
import { dispatchQueuedOrders } from "../src/lib/queued-orders";
async function run() { try { await dispatchQueuedOrders(); } catch (error) { console.error("Queue worker failed", error); } finally { setTimeout(run, 60000); } }
console.log("Queued orders worker running: checking funds every 60 seconds.");
void run();
