import "dotenv/config";
import pg from "pg";
import crypto from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
export async function setupTestDatabase(){
 if(!process.env.DATABASE_URL?.startsWith("postgres"))throw new Error("PostgreSQL DATABASE_URL required for tests");
 const url=new URL(process.env.DATABASE_URL),schema="smm_test_"+crypto.randomBytes(8).toString("hex");
 const client=new pg.Client({connectionString:url.toString(),connectionTimeoutMillis:10000});await client.connect();
 try{await client.query('CREATE SCHEMA "'+schema+'"');await client.query('SET search_path TO "'+schema+'"');await client.query(await readFile(path.join(process.cwd(),"prisma/migrations/202610110001_postgresql/migration.sql"),"utf8"));}catch(error){await client.end();throw error;}
 url.searchParams.set("schema",schema);process.env.DATABASE_URL=url.toString();
 return async()=>{const {prisma}=await import("../src/lib/db");await prisma.$disconnect();if(!/^smm_test_[a-f0-9]{16}$/.test(schema))throw new Error("Unsafe test schema");try{await client.query('DROP SCHEMA "'+schema+'" CASCADE');}finally{await client.end();}};
}
