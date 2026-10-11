import "dotenv/config";
import {ensureInitialAdmin} from "../src/lib/auth";
import {prisma} from "../src/lib/db";
ensureInitialAdmin().then(()=>console.log("Administrator verified. No demo suppliers, services or balances created.")).finally(()=>prisma.$disconnect());
