import crypto from "node:crypto";
import {Prisma} from "@prisma/client";
import {sellingPrice} from "./pricing";
import {prisma} from "./db";
import {SmmServiceItem} from "./smm-client";
export async function importServices(provider:{id:string;currency:string},services:SmmServiceItem[]){
 const valid=new Map<string,any>();
 for(const upstream of services){
  if(upstream.service===undefined||upstream.service===null)continue;
  const upstreamId=String(upstream.service).trim(),min=Number(upstream.min??10),max=Number(upstream.max??100000),rate=Number(upstream.rate??0);
  if(!upstreamId||!upstream.name||!Number.isInteger(min)||!Number.isInteger(max)||min<1||max<min||!Number.isFinite(rate)||rate<0)continue;
  valid.set(upstreamId,{upstreamId,name:upstream.name,category:upstream.category||"General",minQuantity:min,maxQuantity:max,ratePer1000:rate,sellingRatePer1000:sellingPrice(rate,provider.currency)});
 }
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${provider.id}))`;
  const existing=await tx.serviceMapping.findMany({where:{primaryProviderId:provider.id},select:{primaryServiceId:true,serviceId:true}});
  const ids=new Map(existing.map(x=>[x.primaryServiceId,x.serviceId]));
  const rows=Array.from(valid.values()).map(row=>({...row,id:ids.get(row.upstreamId)||crypto.randomUUID(),mappingId:crypto.randomUUID()}));
  for(let offset=0;offset<rows.length;offset+=500){
   const batch=JSON.stringify(rows.slice(offset,offset+500));
   await tx.$executeRaw(Prisma.sql`INSERT INTO services (id,name,category,"minQuantity","maxQuantity","ratePer1000","sellingRatePer1000","isActive","createdAt","updatedAt")
    SELECT id,name,category,"minQuantity","maxQuantity","ratePer1000","sellingRatePer1000",true,timezone('UTC',now()),timezone('UTC',now())
    FROM jsonb_to_recordset(${batch}::jsonb) AS x(id text,name text,category text,"minQuantity" integer,"maxQuantity" integer,"ratePer1000" numeric,"sellingRatePer1000" numeric)
    ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,"minQuantity"=EXCLUDED."minQuantity","maxQuantity"=EXCLUDED."maxQuantity","ratePer1000"=EXCLUDED."ratePer1000","sellingRatePer1000"=EXCLUDED."sellingRatePer1000","updatedAt"=EXCLUDED."updatedAt","isActive"=true`);
   await tx.$executeRaw(Prisma.sql`INSERT INTO service_mappings (id,"serviceId","primaryProviderId","primaryServiceId","autoFailover","createdAt","updatedAt")
    SELECT "mappingId",id,${provider.id},"upstreamId",false,timezone('UTC',now()),timezone('UTC',now()) FROM jsonb_to_recordset(${batch}::jsonb) AS x("mappingId" text,id text,"upstreamId" text)
    ON CONFLICT ("primaryProviderId","primaryServiceId") DO NOTHING`);
  }
  if(rows.length){await tx.service.updateMany({where:{mapping:{primaryProviderId:provider.id},id:{notIn:rows.map(row=>row.id)}},data:{isActive:false}});}
  return rows.length;
 },{maxWait:10000,timeout:60000});
}
