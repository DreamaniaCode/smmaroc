import {Prisma} from "@prisma/client";
import {prisma} from "./db";
import {SmmClient} from "./smm-client";
const active=["PENDING","PROCESSING","IN_PROGRESS"];
export function supplierStatus(value:unknown):string|null{
 const key=String(value??"").trim().toLowerCase().replace(/[_-]/g," ").replace(/\s+/g," ");
 return ({pending:"PENDING",processing:"PROCESSING","in progress":"IN_PROGRESS",inprogress:"IN_PROGRESS",completed:"COMPLETED",partial:"PARTIAL",canceled:"CANCELED",cancelled:"CANCELED",refunded:"CANCELED"} as Record<string,string>)[key]||null;
}
function counter(value:unknown){if(value===null||value===undefined||String(value).trim()==="")return undefined;const number=Number(value);return Number.isSafeInteger(number)&&number>=0&&number<=2147483647?number:undefined;}
/** Read statuses only: never sends orders, triggers failover, or changes wallet balances. */
export async function refreshOrderStatuses(scope:Prisma.OrderWhereInput,force=false){
 const rows=await prisma.order.findMany({where:{AND:[scope,{status:{in:active},providerOrderId:{not:null},currentProviderId:{not:null}},...(force?[]:[{updatedAt:{lte:new Date(Date.now()-15000)}}])]},include:{currentProvider:true},orderBy:{updatedAt:"asc"},take:100});
 const groups=new Map<string,typeof rows>();for(const row of rows){if(!row.currentProvider)continue;const group=groups.get(row.currentProviderId!)||[];group.push(row);groups.set(row.currentProviderId!,group);}
 let updated=0,failed=0;
 await Promise.all(Array.from(groups.values()).map(async orders=>{
  try{const provider=orders[0].currentProvider!;const client=new SmmClient(provider.apiUrl,provider.apiKey,15000);
   const results=orders.length===1?{[orders[0].providerOrderId!]:await client.getStatus(orders[0].providerOrderId!)}:await client.getMultiStatus(orders.map(o=>o.providerOrderId!));
   for(const order of orders){const result=results?.[order.providerOrderId!];const status=supplierStatus(result?.status);if(result?.error||!status){failed++;continue;}
    const count=await prisma.order.updateMany({where:{id:order.id,currentProviderId:provider.id,providerOrderId:order.providerOrderId,status:order.status,updatedAt:order.updatedAt},data:{status,...(counter(result.start_count)!==undefined?{startCount:counter(result.start_count)}:{}),...(counter(result.remains)!==undefined?{remains:counter(result.remains)}:{}),updatedAt:new Date()}});updated+=count.count;
   }
  }catch(error:any){console.warn("[order-status-sync]",{kind:/timeout/i.test(error?.message||"")?"timeout":error?.code||error?.name||"error"});failed+=orders.length;}
 }));
 return {updated,failed,checkedAt:updated?new Date().toISOString():null};
}
