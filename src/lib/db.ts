import { PrismaClient, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { sellingPrice } from "./pricing";
const globalDb=globalThis as unknown as {smmPrisma?:PrismaClient};
export const prisma=globalDb.smmPrisma ?? new PrismaClient();
if(process.env.NODE_ENV!=="production") globalDb.smmPrisma=prisma;
function normalize(value:any):any {
 if(value instanceof Prisma.Decimal)return value.toNumber();
 if(value instanceof Date)return value.toISOString();
 if(Array.isArray(value))return value.map(normalize);
 if(value && typeof value==="object")return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalize(v)]));
 return value;
}
const publicProvider={select:{id:true,name:true,balance:true,currency:true}};
const mappingInclude={primaryProvider:true,backupProvider:true};
const orderInclude={user:{select:{id:true,name:true,email:true}},client:{select:{id:true,name:true}},service:{select:{id:true,name:true,category:true}},currentProvider:{select:{id:true,name:true}}};
function validAmount(amount:number){if(!Number.isFinite(amount)||amount<0)throw new Error("Invalid amount");}
export const db={
 async debitWallet(userId:string,amount:number){validAmount(amount);const result=await prisma.user.updateMany({where:{id:userId,balance:{gte:amount}},data:{balance:{decrement:amount}}});return result.count===1;},
 async creditWallet(userId:string,amount:number){validAmount(amount);await prisma.user.update({where:{id:userId},data:{balance:{increment:amount}}});},
 async reviewDeposit(id:string,status:string,adminNotes:string|null){
  if(!["APPROVED","REJECTED"].includes(status))throw new Error("Invalid deposit status");
  return prisma.$transaction(async tx=>{
   const current=await tx.deposit.findUnique({where:{id},include:{user:true}});
   if(!current)throw new Error("Deposit not found");
   if(current.currency!==current.user.currency)throw new Error("Deposit currency must match wallet currency");
   const claim=await tx.deposit.updateMany({where:{id,status:"PENDING"},data:{status,adminNotes}});
   if(claim.count!==1)throw new Error("Deposit already reviewed");
   if(status==="APPROVED")await tx.user.update({where:{id:current.userId},data:{balance:{increment:current.amount}}});
   const {user,...deposit}=current;return normalize({...deposit,status,adminNotes});
  });
 },
 serviceMapping:{async findFirst(args:any){return normalize(await prisma.serviceMapping.findFirst(args));}},
 user:{
  async findUnique({where}:any){return normalize(where.email?await prisma.user.findFirst({where:{email:{equals:where.email,mode:"insensitive"}}}):await prisma.user.findUnique({where}));},
  async findMany(args:any={}):Promise<any[]>{return normalize(await prisma.user.findMany({...args,orderBy:args.orderBy??{createdAt:"desc"}}));},
  async count(args:any={}){return prisma.user.count(args);},
  async create({data}:any){return normalize(await prisma.user.create({data:{...data,email:data.email.toLowerCase(),apiKey:data.apiKey??"smm_live_"+crypto.randomBytes(16).toString("hex")}}));},
  async update({where,data}:any){return normalize(await prisma.user.update({where,data}));}
 },
 deposit:{
  async findMany(args:any={}):Promise<any[]>{return normalize(await prisma.deposit.findMany({...args,orderBy:args.orderBy??{createdAt:"desc"},...(args.select?{}:{include:args.include??{user:{select:{name:true,email:true}}}})}));},
  async findUnique(args:any){return normalize(await prisma.deposit.findUnique({...args,...(args.select?{}:{include:{user:{select:{name:true,email:true}}}})}));},
  async create(args:any){return normalize(await prisma.deposit.create(args));},
  async update(args:any){return normalize(await prisma.deposit.update(args));},
  async count(args:any={}){return prisma.deposit.count(args);}
 },
 client:{
  async findMany(args:any={}):Promise<any[]>{return normalize(await prisma.client.findMany({...args,orderBy:args.orderBy??{name:"asc"},...(args.select?{}:{...(args.select?{}:{include:args.include??{_count:{select:{orders:true}}}})})}));},
  async create(args:any){return normalize(await prisma.client.create(args));},
  async upsert(args:any){return normalize(await prisma.client.upsert(args));},
  async count(args:any={}){return prisma.client.count(args);}
 },
 provider:{
  async findMany(args:any={}):Promise<any[]>{return normalize(await prisma.provider.findMany({...args,orderBy:args.orderBy??{createdAt:"desc"},...(args.select?{}:{include:args.include??{_count:{select:{orders:true}}}})}));},
  async findUnique(args:any){return normalize(await prisma.provider.findUnique(args));},
  async create(args:any){return normalize(await prisma.provider.create(args));},
  async update(args:any){return normalize(await prisma.provider.update(args));}
 },
 service:{
  async findMany(args:any={}):Promise<any[]>{return normalize(await prisma.service.findMany({...args,orderBy:args.orderBy??[{category:"asc"},{name:"asc"}],...(args.select?{}:{include:args.include??{mapping:{include:{primaryProvider:publicProvider,backupProvider:publicProvider}}}})}));},
  async findUnique(args:any){return normalize(await prisma.service.findUnique({...args,...(args.select?{}:{...(args.select?{}:{include:args.include??{mapping:{include:mappingInclude}}})})}));},
  async findFirst(args:any){return normalize(await prisma.service.findFirst({...args,...(args.select?{}:{include:args.include??{mapping:{include:mappingInclude}}})}));},
  async create({data,...args}:any){
   const currency=data.mapping?.create?.primaryProviderId?(await prisma.provider.findUnique({where:{id:data.mapping.create.primaryProviderId},select:{currency:true}}))?.currency:"USD";
   return normalize(await prisma.service.create({...args,data:{...data,sellingRatePer1000:data.sellingRatePer1000??sellingPrice(Number(data.ratePer1000??0),currency)}}));
  },
  async update(args:any){return normalize(await prisma.service.update(args));}
 },
 order:{
  async claimQueued(id:string){return (await prisma.order.updateMany({where:{id,status:"AWAITING_FUNDS",providerOrderId:null},data:{status:"DISPATCHING"}})).count===1;},
  async findMany(args:any={}):Promise<any[]>{return normalize(await prisma.order.findMany({...args,orderBy:args.orderBy??{createdAt:"desc"},...(args.select?{}:{...(args.select?{}:{include:{...orderInclude,...args.include}})})}));},
  async findUnique(args:any){return normalize(await prisma.order.findUnique({...args,...(args.select?{}:{include:{...orderInclude,...args.include}})}));},
  async create(args:any){return normalize(await prisma.order.create(args));},
  async update(args:any){return normalize(await prisma.order.update(args));},
  async count(args:any={}){return prisma.order.count(args);},
  async aggregate(args:any){return normalize(await prisma.order.aggregate(args));}
 },
 support:{
  async findMany(userId?:string):Promise<any[]>{const rows=await prisma.supportRequest.findMany({where:userId?{userId}:undefined,orderBy:{createdAt:"desc"},include:{user:{select:{email:true}}}});return normalize(rows.map(({user,...row})=>({...row,email:user.email})));},
  async create(userId:string,message:string){return normalize(await prisma.supportRequest.create({data:{userId,message}}));},
  async reply(id:string,reply:string){return (await prisma.supportRequest.updateMany({where:{id},data:{reply}})).count;}
 },
 appSetting:{
  async findMany(){return normalize(await prisma.appSetting.findMany());},
  async findUnique(args:any){return normalize(await prisma.appSetting.findUnique(args));},
  async upsert(args:any){return normalize(await prisma.appSetting.upsert(args));}
 }
};
