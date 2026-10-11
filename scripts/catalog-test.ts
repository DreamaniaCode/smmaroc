import "dotenv/config";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { databaseUrl } from "../src/lib/database-url";
import { fetchCatalog } from "../src/lib/catalog-client";
import { db, prisma } from "../src/lib/db";
import { GET } from "../src/app/api/services/route";

async function main() {
  assert.equal(new URL(databaseUrl("postgres://user:pass@localhost/app")!).searchParams.get("schema"), "smmaroc");
  assert.equal(new URL(databaseUrl("postgres://user:pass@localhost/app?schema=test&sslmode=require")!).searchParams.get("schema"), "test");
  const originalFind = db.service.findMany, originalFetch = globalThis.fetch;
  try {
    db.service.findMany = async (args: any) => { assert.ok(args.select); assert.equal(args.include, undefined); return [{id:"example", name:"Service", sellingRatePer1000:1.8}]; };
    const success = await GET(new NextRequest("http://localhost/api/services"));
    assert.equal(success.status, 200); assert.equal((await success.json()).services.length, 1);
    db.service.findMany = async () => { throw {code:"P2021", message:"private connection details"}; };
    const failure = await GET(new NextRequest("http://localhost/api/services"));
    assert.equal(failure.status, 503); const body = await failure.text(); assert.ok(JSON.parse(body).error); assert.ok(!body.includes("private connection"));
    globalThis.fetch = async () => new Response(null, {status:500});
    await assert.rejects(fetchCatalog, /temporairement indisponible/);
    globalThis.fetch = async () => Response.json({services:[{id:"example"}]});
    assert.equal((await fetchCatalog()).length, 1);
    globalThis.fetch = async () => Response.json({});
    await assert.rejects(fetchCatalog, /incomplet/);
    console.log("PASS: default schema, explicit schema preservation, public projection, JSON database failures, empty response recovery.");
  } finally { db.service.findMany = originalFind; globalThis.fetch = originalFetch; await prisma.$disconnect(); }
}
main().catch(e => {console.error(e); process.exitCode=1;});
