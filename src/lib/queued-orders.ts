import { db } from "./db";
import { SmmClient, SupplierBalanceError, OrderNotSubmittedError } from "./smm-client";
export async function dispatchQueuedOrders(options: {providerId?:string;orderId?:string;limit?:number} = {}) {
 const queued = await db.order.findMany({where:{status:"AWAITING_FUNDS",providerOrderId:null,...(options.orderId?{id:options.orderId}:{}),...(options.providerId?{currentProviderId:options.providerId}:{})},orderBy:{createdAt:"asc"},take:options.limit ?? 100,include:{currentProvider:true}});
 let dispatched=0;
 for(const order of queued) {
  if(!await db.order.claimQueued(order.id)) continue;
  try {
   const service=await db.service.findUnique({where:{id:order.serviceId}});
   if(!service?.isActive)throw new OrderNotSubmittedError("Service indisponible : choisissez un service actif du catalogue.");
   const provider=order.currentProvider;
   const mapping=service?.mapping;
   if(!provider?.isActive || !mapping) throw new Error("Configuration fournisseur indisponible");
   const serviceId=provider.id===mapping.primaryProviderId ? mapping.primaryServiceId : mapping.backupServiceId;
   if(!serviceId) throw new Error("Service fournisseur indisponible");
   const client=new SmmClient(provider.apiUrl,provider.apiKey);
   const result=await client.addOrder({service:serviceId,link:order.link,quantity:order.quantity,runs:order.runs,interval:order.intervalMinutes,ratePer1000:provider.id===mapping.primaryProviderId?service.ratePer1000:undefined});
   await db.order.update({where:{id:order.id},data:{providerOrderId:result.order,status:"PROCESSING",failoverReason:null}});
   dispatched++;
  } catch(error) {
   const message=String(error instanceof Error?error.message:"Erreur inconnue").split(order.currentProvider?.apiKey||"[no-key]").join("[redacted]").replace(/https?:\/\/[^\s)]+/g,"[URL]").slice(0,400);
   await db.order.update({where:{id:order.id},data:{status:error instanceof SupplierBalanceError?"AWAITING_FUNDS":"REVIEW_REQUIRED",failoverReason:error instanceof SupplierBalanceError?"En attente de traitement":(error instanceof OrderNotSubmittedError?"Non envoyée : ":"Envoi incertain : ")+message}});
  }
 }
 return {dispatched};
}
