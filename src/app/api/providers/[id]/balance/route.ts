import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {verifySessionToken} from "@/lib/auth";
import {SmmClient,normalizeProviderUrl} from "@/lib/smm-client";
import {dispatchQueuedOrders} from "@/lib/queued-orders";
export const maxDuration=180;
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const token=req.cookies.get("smm_session")?.value;const session=token?await verifySessionToken(token):null;
 if(!session||session.role!=="ADMIN")return NextResponse.json({error:"Accès administrateur requis"},{status:session?403:401});
 try{const {id}=await params;const provider=await db.provider.findUnique({where:{id}});
 if(!provider)return NextResponse.json({error:"Fournisseur introuvable"},{status:404});
 const apiUrl=normalizeProviderUrl(provider.apiUrl);
 const balance=await new SmmClient(apiUrl,provider.apiKey).getBalance();
 const updated=await db.provider.update({where:{id},data:{...balance,apiUrl,lastCheckedAt:new Date()}});
 let queue={dispatched:0};let queueWarning:string|null=null;
 if(balance.balance>0 && provider.isActive){try{queue=await dispatchQueuedOrders({providerId:id,limit:1});}catch{queueWarning="Solde actualisé, mais la reprise des commandes a échoué. Réessayez.";}}
 return NextResponse.json({queueWarning,dispatched:queue.dispatched,balance:updated.balance,currency:updated.currency,lastCheckedAt:updated.lastCheckedAt,apiUrl:updated.apiUrl});
 }catch{return NextResponse.json({error:"Impossible de vérifier le solde fournisseur. Vérifiez l’URL API et la clé, puis réessayez. Le dernier solde connu est conservé."},{status:502});}
}
