import { NextResponse } from "next/server";
import { paymentDefaults, paymentInstructions } from "@/lib/payments";
export async function GET(){const methods:Record<string,string>={};for(const name of Object.keys(paymentDefaults)){const value=await paymentInstructions(name);if(value) methods[name]=value;}return NextResponse.json({methods});}

export const dynamic = "force-dynamic";
