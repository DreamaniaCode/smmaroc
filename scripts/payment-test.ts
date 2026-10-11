import {setupTestDatabase} from "./test-database";
import assert from "node:assert/strict";
import {mkdtempSync,unlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {NextRequest} from "next/server";
async function main(){
 const cleanup=await setupTestDatabase();try{delete process.env.TELEGRAM_BOT_TOKEN;delete process.env.TELEGRAM_CHAT_ID;
 const {db}=await import("../src/lib/db");const {createSessionToken}=await import("../src/lib/auth");
 const {POST}=await import("../src/app/api/deposits/route");const {GET:proofGET}=await import("../src/app/api/deposits/[id]/proof/route");
 const {paymentAmounts,paymentInstructions}=await import("../src/lib/payments");assert.deepEqual(paymentAmounts(100,"PAYPAL"),{feeAmount:5,paidAmount:105});assert.deepEqual(paymentAmounts(100,"BANK_TRANSFER"),{feeAmount:0,paidAmount:100});assert.equal(await paymentInstructions("BANK_TRANSFER"),"007 450 0013991700300104 14");
 const user=await db.user.create({data:{name:"Test",email:"test@example.test",passwordHash:"test",balance:0}});const other=await db.user.create({data:{name:"Other",email:"other@example.test",passwordHash:"test",balance:0}});
 const token=await createSessionToken({userId:user.id,name:user.name,email:user.email,role:"USER"});const otherToken=await createSessionToken({userId:other.id,name:other.name,email:other.email,role:"USER"});
 const form=new FormData();for(const [key,value] of Object.entries({amount:"100",currency:"MAD",method:"PAYPAL",reference:"test-payment",feeAmount:"0",paidAmount:"100"}))form.set(key,value);form.set("proof",new File(["%PDF-1.4\nTest receipt"],"receipt.pdf",{type:"application/pdf"}));
 const res=await POST(new NextRequest("http://localhost/api/deposits",{method:"POST",headers:{cookie:"smm_session="+token},body:form}));assert.equal(res.status,200);const {deposit}=await res.json();assert.equal(deposit.feeAmount,5);assert.equal(deposit.paidAmount,105);assert.equal(deposit.amount,100);assert.equal(deposit.status,"PENDING");assert.equal((await db.user.findUnique({where:{id:user.id}})).balance,0);
 const opts={params:Promise.resolve({id:deposit.id})};assert.equal((await proofGET(new NextRequest("http://localhost/proof",{headers:{cookie:"smm_session="+token}}),opts)).status,200);assert.equal((await proofGET(new NextRequest("http://localhost/proof",{headers:{cookie:"smm_session="+otherToken}}),opts)).status,404);assert.equal((await proofGET(new NextRequest("http://localhost/proof"),opts)).status,401);
 await db.reviewDeposit(deposit.id,"APPROVED",null);await assert.rejects(()=>db.reviewDeposit(deposit.id,"APPROVED",null));assert.equal((await db.user.findUnique({where:{id:user.id}})).balance,100);
 unlinkSync(path.join(process.cwd(),"data","payment-proofs",deposit.proofFilename));
 const bank=await POST(new NextRequest("http://localhost/api/deposits",{method:"POST",headers:{cookie:"smm_session="+token,"Content-Type":"application/json"},body:JSON.stringify({amount:100,method:"BANK_TRANSFER",reference:"bank-test",paymentTiming:"STANDARD"})}));assert.equal(bank.status,200);assert.match((await bank.json()).message,/48 h/);
 const {POST:supportPOST,GET:supportGET}=await import("../src/app/api/support/route");const req=await supportPOST(new NextRequest("http://localhost/api/support",{method:"POST",headers:{cookie:"smm_session="+token,"Content-Type":"application/json"},body:JSON.stringify({message:"Autre moyen de paiement"})}));assert.equal(req.status,200);const own=await supportGET(new NextRequest("http://localhost/api/support",{headers:{cookie:"smm_session="+token}}));assert.equal((await own.json()).requests.length,1);const others=await supportGET(new NextRequest("http://localhost/api/support",{headers:{cookie:"smm_session="+otherToken}}));assert.equal((await others.json()).requests.length,0);
 console.log("PASS: shared bank, server-calculated PayPal 5%, private receipts, manual single credit, 48h notice, isolated support requests.");
}finally{await cleanup();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
