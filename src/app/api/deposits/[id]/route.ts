import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const token=req.cookies.get('smm_session')?.value;const session=token?await verifySessionToken(token):null;
 if(session?.role!=='ADMIN')return NextResponse.json({error:'Admin required'},{status:403});
 try{const {id}=await params;const {status,adminNotes}=await req.json();
 if(!['APPROVED','REJECTED'].includes(status))return NextResponse.json({error:'Invalid status'},{status:400});
 const deposit=await db.reviewDeposit(id,status,typeof adminNotes === "string" ? adminNotes : null);return NextResponse.json({success:true,deposit});
 }catch(e:any){return NextResponse.json({error:e.message||'Deposit update failed'},{status:400});}
}
