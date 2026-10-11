import "dotenv/config";
import pg from "pg";
async function main(){const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});try{await client.connect();const result=await client.query("SELECT current_database() AS database, current_user AS role, version() AS version");console.log(result.rows[0]);const tables=await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema,table_name");console.log({tables:tables.rows});}catch(e:any){console.error("Database connection failed",e.code||e.name);process.exitCode=1;}finally{await client.end();}}
void main();
