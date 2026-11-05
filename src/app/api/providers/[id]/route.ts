import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {verifySessionToken} from "@/lib/auth";
import {SmmClient,normalizeProviderUrl} from "@/lib/smm-client";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const token=req.cookies.get("smm_session")?.value;const session=token?await verifySessionToken(token):null;
 if(!session||session.role!=="ADMIN")return NextResponse.json({error:"Accès administrateur requis"},{status:session?403:401});
 try{const {id}=await params;const old=await db.provider.findUnique({where:{id}});if(!old)return NextResponse.json({error:"Fournisseur introuvable"},{status:404});
 const body=await req.json();const apiUrl=normalizeProviderUrl(body.apiUrl||old.apiUrl);const apiKey=body.apiKey?.trim()||old.apiKey;
 const lowBalanceLimit=Number(body.lowBalanceLimit??old.lowBalanceLimit);if(!Number.isFinite(lowBalanceLimit)||lowBalanceLimit<0)return NextResponse.json({error:"Seuil de solde invalide"},{status:400});
 const balance=await new SmmClient(apiUrl,apiKey).getBalance();
 const updated=await db.provider.update({where:{id},data:{name:body.name?.trim()||old.name,apiUrl,apiKey,lowBalanceLimit,...balance,lastCheckedAt:new Date()}});
 return NextResponse.json({success:true,balance:updated.balance,currency:updated.currency});
 }catch{return NextResponse.json({error:"Connexion fournisseur impossible. Vérifiez l’URL et la clé API du compte rechargé. La configuration précédente est conservée."},{status:502});}
}
