import assert from "node:assert/strict";
async function main(){
const base=process.env.SMM_TEST_URL||"http://localhost:3000";
for(const page of ["/","/login","/register","/orders/new","/orders","/services","/add-funds","/api-docs","/dashboard","/providers","/clients","/settings","/admin/deposits","/support"]){const r=await fetch(base+page);assert.equal(r.status,200,page);}
const catalog=await fetch(base+"/api/services").then(r=>r.json());assert.ok(catalog.services.length>100);assert.ok(catalog.services.every((s:any)=>!s.mapping && s.ratePer1000===undefined));
for(const route of ["/api/auth/me","/api/orders","/api/providers","/api/settings","/api/deposits","/api/support","/api/deposits/nonexistent/proof"]){const r=await fetch(base+route);assert.equal(r.status,401,route);}
const payments=await fetch(base+"/api/payment-methods");assert.equal(payments.status,200);
console.log("PASS: 14 pages return 200, "+catalog.services.length+" public services, upstream details hidden, protected endpoints return 401, payment configuration endpoint available.");
}
main().catch(e=>{console.error(e);process.exitCode=1});
