import "dotenv/config";
import assert from "node:assert/strict";
import {db,prisma} from "../src/lib/db";
import {createSessionToken} from "../src/lib/auth";
async function main(){
 const user=(await db.user.findMany({where:{role:"ADMIN"}}))[0];assert.ok(user,"No existing ADMIN account found");
 const token=await createSessionToken({userId:user.id,email:user.email,name:user.name,role:"ADMIN"});
 const base=process.env.SMM_TEST_URL||"http://127.0.0.1:3000";
 for(const route of ["/api/auth/me","/api/stats","/api/providers","/api/orders","/api/deposits","/api/support","/api/settings","/api/clients"]){const response=await fetch(base+route,{headers:{cookie:"smm_session="+token}});assert.equal(response.status,200,route);const data=await response.json();assert.equal(data.error,undefined,route);}
 const services=await db.service.findMany();assert.equal(services.length,9159);assert.equal((await db.provider.findMany()).length,2);
 if(user.apiKey){
 const balance=await fetch(base+"/api/v2",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:user.apiKey,action:"balance"})});assert.equal(balance.status,200);const result=await balance.json();assert.equal(Number(result.balance),Math.round(user.balance*100)/100);
 }
 console.log("PASS: PostgreSQL catalog preserved, 8 authenticated API reads, numeric wallet API and admin stats work.");
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>prisma.$disconnect());
