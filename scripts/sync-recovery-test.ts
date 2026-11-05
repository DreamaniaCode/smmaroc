import {setupTestDatabase} from "./test-database";
import assert from "node:assert/strict";import {NextRequest} from "next/server";import {SmmClient} from "../src/lib/smm-client";
async function main(){const cleanup=await setupTestDatabase();const original=(SmmClient.prototype as any).post;try{
 const {db,prisma}=await import("../src/lib/db");const {importServices}=await import("../src/lib/sync-services");const {createSessionToken}=await import("../src/lib/auth");const {POST}=await import("../src/app/api/orders/[id]/retry/route");const {dispatchQueuedOrders}=await import("../src/lib/queued-orders");
 const provider=await db.provider.create({data:{name:"Test",apiUrl:"https://example.test/api",apiKey:"test",currency:"USD"}});
 const user=await prisma.user.create({data:{name:"Customer",email:"customer@test.invalid",passwordHash:"test",balance:74}});
 const old=await db.service.create({data:{name:"Removed service",category:"Instagram",mapping:{create:{primaryProviderId:provider.id,primaryServiceId:"removed"}}}});
 const order=await prisma.order.create({data:{userId:user.id,serviceId:old.id,currentProviderId:provider.id,link:"https://example.test/profile",quantity:2800,customerCost:26,status:"REVIEW_REQUIRED"}});
 const items=Array.from({length:1201},(_,i)=>({service:String(i+1),name:"Instagram Followers "+i,category:"Instagram",rate:"0.5",min:"10",max:"5000"}));
 const started=Date.now();assert.equal(await importServices(provider,items),1201);console.log("Batch sync ms:",Date.now()-started);
 assert.equal((await db.service.findUnique({where:{id:old.id}})).isActive,false);assert.equal(await prisma.order.count(),1);
 const active=await db.service.findMany();assert.equal(active.length,1201);
 await Promise.all([importServices(provider,items),importServices(provider,items)]);assert.equal(await prisma.service.count(),1202);assert.equal(await prisma.serviceMapping.count(),1202);assert.equal((await db.service.findMany())[0].id,active[0].id);
 const token=await createSessionToken({userId:"testadmin",email:"admin@test.invalid",name:"Admin",role:"ADMIN"});const opts={params:Promise.resolve({id:order.id})};
 const req=(confirmed:boolean,serviceId=active[0].id)=>new NextRequest("http://localhost/retry",{method:"POST",headers:{cookie:"smm_session="+token,"Content-Type":"application/json"},body:JSON.stringify({confirmedNotSubmitted:confirmed,serviceId})});
 assert.equal((await POST(req(false),opts)).status,409);assert.equal((await POST(req(true,old.id),opts)).status,400);
 let adds=0;let mode="success";(SmmClient.prototype as any).post=async(params:any)=>{if(params.action==="balance")return mode==="preflight"?"invalid":{balance:"10",currency:"USD"};adds++;if(mode==="ambiguous")throw new Error("connection lost");return {order:123};};
 const response=await POST(req(true),opts);assert.equal(response.status,200);assert.equal((await response.json()).status,"PROCESSING");assert.equal(adds,1);assert.equal(Number((await prisma.user.findUniqueOrThrow({where:{id:user.id}})).balance),74);assert.equal(Number((await prisma.order.findUniqueOrThrow({where:{id:order.id}})).customerCost),26);assert.equal((await POST(req(true),opts)).status,409);assert.equal(adds,1);
 for(const testMode of ["preflight","ambiguous"]){mode=testMode;const held=await prisma.order.create({data:{userId:user.id,serviceId:active[0].id,currentProviderId:provider.id,link:"https://example.test/profile",quantity:100,status:"AWAITING_FUNDS"}});await dispatchQueuedOrders({orderId:held.id});const result=await prisma.order.findUniqueOrThrow({where:{id:held.id}});assert.equal(result.status,"REVIEW_REQUIRED");assert.match(result.failoverReason!,testMode==="preflight"?/Non envoyée/:/Envoi incertain/);const count:number=adds;await dispatchQueuedOrders({orderId:held.id});assert.equal(adds,count);}
 console.log("PASS: batched concurrent/idempotent sync, retired services hidden without deleting orders, confirmed retry only, no double debit, no uncertain automatic resend.");
 }finally{(SmmClient.prototype as any).post=original;await cleanup();}}main().catch(e=>{console.error(e);process.exitCode=1});
