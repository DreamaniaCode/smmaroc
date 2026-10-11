import {NextRequest,NextResponse} from "next/server";
import {verifySessionToken} from "@/lib/auth";
import {db} from "@/lib/db";
import {readFile} from "node:fs/promises";
import path from "node:path";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const token=req.cookies.get("smm_session")?.value,session=token?await verifySessionToken(token):null;
 if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {id}=await params;const deposit=await db.deposit.findUnique({where:{id}});
 if(!deposit || (session.role!=="ADMIN" && deposit.userId!==session.userId) || !deposit.proofFilename || !/^[a-f0-9-]+\.(png|jpg|pdf)$/.test(deposit.proofFilename))return NextResponse.json({error:"Not found"},{status:404});
 try{const bytes=await readFile(path.join(process.cwd(),"data","payment-proofs",deposit.proofFilename));const type=deposit.proofFilename.endsWith("pdf")?"application/pdf":deposit.proofFilename.endsWith("png")?"image/png":"image/jpeg";return new NextResponse(new Uint8Array(bytes),{headers:{"Content-Type":type,"Content-Disposition":'attachment; filename="justificatif.'+deposit.proofFilename.split('.').pop()+'"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}catch{return NextResponse.json({error:"Not found"},{status:404});}
}
