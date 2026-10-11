import "dotenv/config";
import {DatabaseSync,backup} from "node:sqlite";
import pg from "pg";
import path from "node:path";
import {mkdirSync} from "node:fs";
pg.types.setTypeParser(1114,value=>new Date(value+"Z"));
const tables=["users","clients","providers","services","service_mappings","orders","deposits","app_settings","support_requests"];
async function main(){
 const source=path.resolve(process.argv[2]||"dev.db");const local=new DatabaseSync(source,{readOnly:true});
 const backupDir=path.join(process.cwd(),"data","backups");mkdirSync(backupDir,{recursive:true});await backup(local,path.join(backupDir,"sqlite-before-postgresql-"+Date.now()+".db"));
 const url=new URL(process.env.DATABASE_URL||"");const schema=url.searchParams.get("schema")||"smmaroc";if(!/^smmaroc$/.test(schema))throw new Error("Import only permitted into the smmaroc application schema");
 const client=new pg.Client({connectionString:url.toString(),connectionTimeoutMillis:10000});await client.connect();let transaction=false;
 try{
  await client.query("BEGIN");transaction=true;await client.query('SET LOCAL search_path TO "'+schema+'"');
  for(const table of tables){const count=await client.query('SELECT count(*) AS count FROM "'+table+'"');if(Number(count.rows[0].count)!==0)throw new Error("Target application data exists; import stopped without overwriting it");}
  local.exec("BEGIN");
  for(const table of tables){
   const exists=local.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);if(!exists)continue;
   const rows=local.prepare('SELECT * FROM "'+table+'"').all() as Record<string,any>[];if(!rows.length){console.log(table+": 0 rows");continue;}
   const columns=Object.keys(rows[0]);if(columns.some(c=>!/^\w+$/.test(c)))throw new Error("Invalid source column");
   const bools=new Set(["isActive","dripFeedAllowed","autoFailover","failoverAttempted"]);
   for(let start=0;start<rows.length;start+=300){const chunk=rows.slice(start,start+300),values:any[]=[];const tuples=chunk.map(row=>"("+columns.map(col=>{values.push(bools.has(col)?Boolean(row[col]):row[col]);return "$"+values.length;}).join(",")+")");await client.query('INSERT INTO "'+table+'" ('+columns.map(c=>'"'+c+'"').join(',')+') VALUES '+tuples.join(','),values);}
   const count=await client.query('SELECT count(*) AS count FROM "'+table+'"');if(Number(count.rows[0].count)!==rows.length)throw new Error("Imported count mismatch for "+table);
   // Verify every stored value, including balances and prices, before committing.
   const imported=await client.query('SELECT * FROM "'+table+'"');const key=table==="app_settings"?"key":"id";const indexed=new Map(imported.rows.map(r=>[r[key],r]));
   for(const row of rows){const target=indexed.get(row[key]);if(!target)throw new Error("Missing imported row");for(const col of columns){const sourceValue=row[col],value=target[col];if(bools.has(col)){if(Boolean(sourceValue)!==value)throw new Error("Boolean mismatch");}else if(value instanceof Date){if(new Date(sourceValue).getTime()!==value.getTime())throw new Error("Timestamp mismatch");}else if(typeof sourceValue==="number"){if(Math.abs(sourceValue-Number(value))>1e-8)throw new Error("Numeric mismatch");}else if(sourceValue!==value)throw new Error("Data mismatch in "+table+"."+col);}}
   console.log(table+": "+rows.length+" rows copied and verified");
  }
  await client.query("COMMIT");transaction=false;local.exec("COMMIT");console.log("Migration committed. SQLite original and backup retained.");
 }catch(error){if(transaction)await client.query("ROLLBACK");throw error;}finally{local.close();await client.end();}
}
main().catch((e:any)=>{console.error("Import failed:",e.code||e.message?.replace(/postgres(?:ql)?:\/\/[^\s]+/g,"[redacted connection]"));process.exitCode=1});
