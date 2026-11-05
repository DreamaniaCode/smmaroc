import {setupTestDatabase} from "./test-database";
import assert from "node:assert/strict";
import {NextRequest} from "next/server";
import {SmmClient,normalizeProviderUrl} from "../src/lib/smm-client";
async function main(){
 assert.equal(normalizeProviderUrl("https://justanotherpanel.com/api/"),"https://justanotherpanel.com/api/v2");
 assert.equal(normalizeProviderUrl("https://example.test/api"),"https://example.test/api");
 const cleanup=await setupTestDatabase();const original=(SmmClient.prototype as any).post;try{
 const {db,prisma}=await import("../src/lib/db");const {createSessionToken}=await import("../src/lib/auth");const {POST}=await import("../src/app/api/providers/[id]/balance/route");
 const user=await prisma.user.create({data:{name:"Customer",email:"customer@test.invalid",passwordHash:"test",balance:74}});
 const provider=await db.provider.create({data:{name:"Supplier",apiUrl:"https://example.test/api",apiKey:"test",balance:0}});
 const service=await db.service.create({data:{name:"Service",category:"Test",ratePer1000:2,mapping:{create:{primaryProviderId:provider.id,primaryServiceId:"1"}}}});
 await prisma.order.create({data:{userId:user.id,serviceId:service.id,currentProviderId:provider.id,quantity:1000,link:"https://example.test/profile",status:"AWAITING_FUNDS",customerCost:26}});
 let raw:any={balance:"12.50",currency:"USD"};let adds=0;
 (SmmClient.prototype as any).post=async(params:any)=>{if(params.action==="balance")return raw;adds++;return {order:123};};
 const {PATCH}=await import("../src/app/api/providers/[id]/route");
 const token=await createSessionToken({userId:"admin",email:"admin@test.invalid",name:"Admin",role:"ADMIN"});
 const req=()=>new NextRequest("http://localhost/api/providers/"+provider.id+"/balance",{method:"POST",headers:{cookie:"smm_session="+token}});const opts={params:Promise.resolve({id:provider.id})};
 assert.equal((await POST(new NextRequest("http://localhost/api/providers/x/balance",{method:"POST"}),opts)).status,401);
 const response=await POST(req(),opts);assert.equal(response.status,200);const data=await response.json();assert.equal(data.balance,12.5);assert.equal(data.dispatched,1);assert.equal(adds,1);
 assert.equal(Number((await prisma.user.findUniqueOrThrow({where:{id:user.id}})).balance),74);
 assert.equal((await prisma.order.findFirstOrThrow()).status,"PROCESSING");
 assert.equal((await POST(req(),opts)).status,200);assert.equal(adds,1);
 raw="<html>Invalid endpoint</html>";assert.equal((await POST(req(),opts)).status,502);assert.equal((await db.provider.findUnique({where:{id:provider.id}})).balance,12.5);
 const patchReq=()=>new NextRequest("http://localhost/api/providers/"+provider.id,{method:"PATCH",headers:{cookie:"smm_session="+token,"Content-Type":"application/json"},body:JSON.stringify({apiKey:"updated-test-key"})});
 assert.equal((await PATCH(patchReq(),opts)).status,502);assert.equal((await db.provider.findUnique({where:{id:provider.id}})).apiKey,"test");
 raw={balance:"15.00",currency:"USD"};assert.equal((await PATCH(patchReq(),opts)).status,200);assert.equal((await db.provider.findUnique({where:{id:provider.id}})).apiKey,"updated-test-key");assert.equal((await prisma.serviceMapping.findUniqueOrThrow({where:{serviceId:service.id}})).primaryProviderId,provider.id);
 for(const value of [{},{balance:"not a number",currency:"USD"},{balance:"",currency:"USD"}]){raw=value;await assert.rejects(()=>new SmmClient("https://example.test/api","test").getBalance(),/invalide/);}
 raw={balance:"0.00",currency:"USD"};assert.equal((await new SmmClient("https://example.test/api","test").getBalance()).balance,0);
 console.log("PASS: supplier balance refresh, invalid responses preserve balance, queued order resumes once, customer wallet is not charged again.");
 }finally{(SmmClient.prototype as any).post=original;await cleanup();}}
main().catch(e=>{console.error(e);process.exitCode=1});
