import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET(){ const methods:Record<string,string>={};for(const name of ["CIH_BANK","ATTIJARIWAFA","CASH_PLUS","USDT_TRC20"]){const setting=await db.appSetting.findUnique({where:{key:"PAYMENT_"+name}});if(setting?.value?.trim())methods[name]=setting.value;}return NextResponse.json({methods});}
