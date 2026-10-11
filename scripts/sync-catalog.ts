import "dotenv/config";
import { db } from "../src/lib/db";
import { SmmClient } from "../src/lib/smm-client";
import { importServices } from "../src/lib/sync-services";
async function main(){ for(const p of await db.provider.findMany({where:{isActive:true}})){try {const services=await new SmmClient(p.apiUrl,p.apiKey).getServices();const imported=await importServices(p,services);console.log(p.name+": "+imported+" / "+services.length+" services synchronisés");}catch(e:any){console.error(p.name+": "+e.message);process.exitCode=1;}}const services=await db.service.findMany();console.log("Catalogue total: "+services.length);}
main().catch(e=>{console.error(e.message);process.exitCode=1});
