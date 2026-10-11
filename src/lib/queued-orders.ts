import { db } from "./db";
import { SmmClient, SupplierBalanceError } from "./smm-client";
export async function dispatchQueuedOrders() {
 const queued = await db.order.findMany({where:{status:"AWAITING_FUNDS"},include:{currentProvider:true}});
 for(const order of queued.reverse()) {
  if(!await db.order.claimQueued(order.id)) continue;
  try {
   const service=await db.service.findUnique({where:{id:order.serviceId}});
   const provider=order.currentProvider;
   const mapping=service?.mapping;
   if(!provider?.isActive || !mapping) throw new Error("Configuration fournisseur indisponible");
   const serviceId=provider.id===mapping.primaryProviderId ? mapping.primaryServiceId : mapping.backupServiceId;
   if(!serviceId) throw new Error("Service fournisseur indisponible");
   const client=new SmmClient(provider.apiUrl,provider.apiKey);
   const result=await client.addOrder({service:serviceId,link:order.link,quantity:order.quantity,runs:order.runs,interval:order.intervalMinutes,ratePer1000:provider.id===mapping.primaryProviderId?service.ratePer1000:undefined});
   await db.order.update({where:{id:order.id},data:{providerOrderId:result.order,status:"PROCESSING",failoverReason:null}});
  } catch(error) {
   await db.order.update({where:{id:order.id},data:{status:error instanceof SupplierBalanceError?"AWAITING_FUNDS":"REVIEW_REQUIRED",failoverReason:error instanceof SupplierBalanceError?"En attente de traitement":"Envoi à vérifier par un administrateur"}});
  }
 }
}
