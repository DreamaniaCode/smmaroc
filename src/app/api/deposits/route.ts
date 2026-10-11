import { paymentInstructions, paymentAmounts } from "@/lib/payments";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { sendTelegramAlert } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where: any = {};
  if (session.role === "USER") {
    where.userId = session.userId;
  }

  const deposits = await db.deposit.findMany({ where, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } });
  return NextResponse.json({ deposits });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: any; let proof: File | null = null;
    if(req.headers.get("content-type")?.includes("multipart/form-data")){const form=await req.formData();body=Object.fromEntries(form.entries());proof=body.proof instanceof File?body.proof:null;} else body=await req.json();
    const {amount,currency,method,reference}=body;
    const parsedAmount=Number(amount);
    if(!Number.isFinite(parsedAmount)||parsedAmount<50||parsedAmount>50000||Math.abs(parsedAmount*100-Math.round(parsedAmount*100))>0.00001) return NextResponse.json({error:"Le montant doit être compris entre 50 et 50 000 MAD, avec deux décimales maximum."},{status:400});
    if(typeof method!=="string" || !await paymentInstructions(method) || typeof reference!=="string" || !reference.trim() || reference.length>500) return NextResponse.json({error:"Mode ou référence de paiement invalide"},{status:400});
    const user=await db.user.findUnique({where:{id:session.userId}});
    if(!user || user.currency!=="MAD" || (currency && currency!==user.currency))return NextResponse.json({error:"Utilisez votre portefeuille en MAD."},{status:400});
    const paymentTiming=method==="BANK_TRANSFER" && body.paymentTiming==="INSTANT"?"INSTANT":"STANDARD";
    const {feeAmount,paidAmount}=paymentAmounts(parsedAmount,method);
    let proofFilename:string|null=null;
    if(proof && proof.size){
      if(proof.size>5*1024*1024)return NextResponse.json({error:"Justificatif limité à 5 Mo."},{status:400});
      const bytes=Buffer.from(await proof.arrayBuffer());
      const ext=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?"png":bytes[0]===255&&bytes[1]===216&&bytes[2]===255?"jpg":bytes.subarray(0,5).toString()==="%PDF-"?"pdf":null;
      if(!ext)return NextResponse.json({error:"Justificatif PNG, JPG ou PDF requis."},{status:400});
      proofFilename=crypto.randomUUID()+"."+ext;
      const dir=path.join(process.cwd(),"data","payment-proofs");await mkdir(dir,{recursive:true});await writeFile(path.join(dir,proofFilename),bytes);
    }
    const deposit = await db.deposit.create({
      data: {
        userId: session.userId,
        amount: parsedAmount,
        feeAmount, paidAmount, paymentTiming, proofFilename,
        currency: user.currency,
        method,
        reference: reference ? String(reference).trim() : null,
        status: "PENDING",
      },
    });

    // Send Telegram alert to admin about new deposit request
    await sendTelegramAlert(`
💰 <b>SMMaroc: New Deposit Submitted</b>
━━━━━━━━━━━━━━━━━━
<b>User:</b> ${session.name} (${session.email})
<b>Amount:</b> ${parsedAmount} ${currency || "MAD"}
<b>Method:</b> ${method}
<b>Reference:</b> <code>${reference || "None provided"}</code>

<i>Please review and approve in the SMMaroc Admin Panel.</i>
`.trim()).catch(() => {});

    return NextResponse.json({ success: true, deposit, message: method === "BANK_TRANSFER" && paymentTiming === "STANDARD" ? "Votre paiement a été déclaré. Sa confirmation peut prendre jusqu’à 48 h. Votre commande sera traitée après confirmation du paiement." : "Votre paiement a été déclaré. Votre justificatif sera vérifié manuellement avant crédit du portefeuille." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit deposit" },
      { status: 500 }
    );
  }
}
