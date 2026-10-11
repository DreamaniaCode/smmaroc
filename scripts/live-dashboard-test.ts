import "dotenv/config";
import assert from "node:assert/strict";
async function main(){
 let base=process.env.SMM_TEST_URL || "https://smmaroc.site";
 const trusted=["https://smmaroc.site","https://www.smmaroc.site","https://smmaroc.vercel.app","http://127.0.0.1:3000"];
 assert.ok(trusted.includes(base));
 const canonical: Response=await fetch(base);
 base=new URL(canonical.url).origin;
 assert.ok(trusted.includes(base),"Unrecognized redirect destination");
 const response=await fetch(base+"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:process.env.ADMIN_INITIAL_EMAIL,password:process.env.ADMIN_INITIAL_PASSWORD})});
 assert.equal(response.status,200,"Admin login"); const cookie=response.headers.get("set-cookie")?.split(";")[0]; assert.ok(cookie);
 for(const route of ["/api/stats","/api/clients","/api/orders","/api/providers","/api/settings"]){const res: Response=await fetch(base+route,{headers:{cookie}});assert.equal(res.status,200,route);const data: any=await res.json();assert.ok(!data.error,route);if(route==="/api/stats"){assert.ok(Array.isArray(data.recentClients));console.log("Registered customers:",data.totalClients);}if(route==="/api/clients"){assert.ok(Array.isArray(data.accounts));assert.ok(data.accounts.every((a:any)=>a.apiKey===undefined&&a.passwordHash===undefined));}}
 console.log("PASS: administrator login and five dashboard APIs on "+base);
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
