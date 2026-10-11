import {setupTestDatabase} from "./test-database";
import assert from "node:assert/strict";
import {NextRequest} from "next/server";
async function main(){const cleanup=await setupTestDatabase();try{
 const {prisma}=await import("../src/lib/db");const {createSessionToken}=await import("../src/lib/auth");
 const {GET:stats}=await import("../src/app/api/stats/route");const {GET:clients}=await import("../src/app/api/clients/route");const {GET:orders}=await import("../src/app/api/orders/route");
 const admin=await prisma.user.create({data:{name:"Admin",email:"admin@test.invalid",passwordHash:"test",role:"ADMIN"}});
 const user=await prisma.user.create({data:{name:"New customer",email:"new@test.invalid",passwordHash:"private",apiKey:"private-key",role:"USER"}});
 const other=await prisma.user.create({data:{name:"Other",email:"other@test.invalid",passwordHash:"private",role:"USER"}});
 const service=await prisma.service.create({data:{name:"Example",category:"Test"}});
 await prisma.order.create({data:{userId:user.id,serviceId:service.id,link:"https://example.test",quantity:100,status:"AWAITING_FUNDS"}});
 await prisma.order.create({data:{userId:other.id,serviceId:service.id,link:"https://other.test",quantity:100,status:"COMPLETED"}});
 const token=await createSessionToken({userId:admin.id,email:admin.email,name:admin.name,role:"ADMIN"});
 const customer=await createSessionToken({userId:user.id,email:user.email,name:user.name,role:"USER"});
 const req=(url:string,t=token)=>new NextRequest("http://localhost"+url,{headers:{cookie:"smm_session="+t}});
 const data=await (await stats(req("/api/stats"))).json();assert.equal(data.totalClients,2);assert.equal(data.recentClients.length,2);assert.equal(data.inProgressOrders,1);
 const listing=await (await clients(req("/api/clients"))).json();assert.equal(listing.accounts.length,2);assert.equal(listing.accounts.find((a:any)=>a.id===user.id)._count.orders,1);assert.ok(listing.accounts.every((a:any)=>a.apiKey===undefined&&a.passwordHash===undefined));
 assert.equal((await (await clients(req("/api/clients",customer))).json()).accounts,undefined);
 const filtered=await (await orders(req("/api/orders?userId="+user.id))).json();assert.equal(filtered.orders.length,1);assert.equal(filtered.orders[0].userId,user.id);
 const own=await (await orders(req("/api/orders?userId="+other.id,customer))).json();assert.equal(own.orders.length,1);assert.equal(own.orders[0].userId,user.id);
 assert.equal((await clients(new NextRequest("http://localhost/api/clients"))).status,401);
 console.log("PASS: registered client counts/list, queued order stats, no account secrets, admin customer filter and customer isolation.");
 }finally{await cleanup();}}
main().catch(e=>{console.error(e);process.exitCode=1});
