import {NextRequest,NextResponse} from "next/server";
import {prisma,db} from "@/lib/db";
import {verifySessionToken} from "@/lib/auth";
import {dispatchQueuedOrders} from "@/lib/queued-orders";
export const maxDuration=120;
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const token=req.cookies.get("smm_session")?.value;const session=token?await verifySessionToken(token):null;
 if(!session||session.role!=="ADMIN")return NextResponse.json({error:"Accès administrateur requis"},{status:session?403:401});
 try{const {id}=await params;const body=await req.json();
 if(body.confirmedNotSubmitted!==true)return NextResponse.json({error:"Vérifiez d’abord dans l’historique fournisseur qu’aucune commande correspondante n’existe."},{status:409});
 const order=await db.order.findUnique({where:{id}});if(!order)return NextResponse.json({error:"Commande introuvable"},{status:404});
 if(order.status!=="REVIEW_REQUIRED"||order.providerOrderId)return NextResponse.json({error:"Cette commande ne peut pas être renvoyée."},{status:409});
 const service=await db.service.findUnique({where:{id:body.serviceId||order.serviceId}});
 if(!service?.isActive||!service.mapping?.primaryProvider?.isActive)return NextResponse.json({error:"Choisissez un service actif après synchronisation du catalogue."},{status:400});
 if(order.quantity<service.minQuantity||order.quantity>service.maxQuantity)return NextResponse.json({error:"La quantité ne respecte pas les limites du service choisi."},{status:400});
 const claim=await prisma.order.updateMany({where:{id,status:"REVIEW_REQUIRED",providerOrderId:null},data:{serviceId:service.id,currentProviderId:service.mapping.primaryProviderId,status:"AWAITING_FUNDS",failoverReason:null}});
 if(claim.count!==1)return NextResponse.json({error:"La commande est déjà en cours de traitement."},{status:409});
 await dispatchQueuedOrders({orderId:id,limit:1});
 const updated=await db.order.findUnique({where:{id}});
 return NextResponse.json({success:updated.status==="PROCESSING",status:updated.status,message:updated.status==="PROCESSING"?"Commande envoyée, sans nouveau débit client.":updated.status==="AWAITING_FUNDS"?"Commande conservée en attente de fonds, sans nouveau débit client.":updated.failoverReason});
 }catch{return NextResponse.json({error:"La reprise n’a pas abouti. Vérifiez le statut avant toute nouvelle tentative."},{status:502});}
}
