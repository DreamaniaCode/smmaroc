import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
async function main(){
const dir=mkdtempSync(path.join(tmpdir(),"smm-smoke-"));process.env.DATABASE_URL="file:"+path.join(dir,"test.db");
const {apiOrderStatus}=await import("../src/lib/order-status");assert.equal(apiOrderStatus("PROCESSING"),"Processing");assert.equal(apiOrderStatus("IN_PROGRESS"),"In progress");assert.equal(apiOrderStatus("FAILED"),"Failed");
const {db}=await import("../src/lib/db");const {importServices}=await import("../src/lib/sync-services");
const user=await db.user.create({data:{name:"Test",email:"test@example.test",passwordHash:"test",balance:10}});
const provider=await db.provider.create({data:{name:"Mock",apiUrl:"https://example.test/api",apiKey:"test",currency:"USD"}});
const catalog=Array.from({length:125},(_,i)=>({service:String(i+1),name:"Service "+i,category:"Instagram",rate:"1",min:"10",max:"10000"}));
assert.equal(await importServices(provider,catalog),125);assert.equal((await db.service.findMany()).length,125);
const {sellingPrice}=await import("../src/lib/pricing");assert.equal(sellingPrice(1,"USD"),18);assert.equal(sellingPrice(1,"MAD"),1.8);assert.equal(sellingPrice(0,"USD"),0);
const first=(await db.service.findMany())[0];assert.equal(first.sellingRatePer1000,18);await db.service.update({where:{id:first.id},data:{sellingRatePer1000:77}});
await importServices(provider,catalog);assert.equal((await db.service.findMany()).length,125);assert.equal((await db.service.findUnique({where:{id:first.id}})).sellingRatePer1000,18);
assert.equal(await db.debitWallet(user.id,7),true);assert.equal(await db.debitWallet(user.id,7),false);assert.equal((await db.user.findUnique({where:{id:user.id}})).balance,3);
await db.creditWallet(user.id,7);assert.equal((await db.user.findUnique({where:{id:user.id}})).balance,10);
const deposit=await db.deposit.create({data:{userId:user.id,amount:5,currency:"MAD",method:"CIH_BANK"}});
await db.reviewDeposit(deposit.id,"APPROVED",null);await assert.rejects(()=>db.reviewDeposit(deposit.id,"APPROVED",null));assert.equal((await db.user.findUnique({where:{id:user.id}})).balance,15);
const order=await db.order.create({data:{userId:user.id,serviceId:first.id,link:"https://example.test/profile",quantity:100,currentProviderId:provider.id}});
const internal=(await db.order.findMany({include:{currentProvider:true}}))[0];assert.equal(internal.currentProvider.apiUrl,"https://example.test/api");
const customer=(await db.order.findMany({include:{currentProvider:{select:{id:true,name:true}}}}))[0];assert.equal(customer.currentProvider.apiKey,undefined);
console.log("PASS: 125 services imported, idempotent sync, 80% prices recalculated, guarded debits, refunds, deposit credited once.");
}
main().catch(e=>{console.error(e);process.exitCode=1});
