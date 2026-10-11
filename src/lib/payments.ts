import { db } from "./db";
export const paymentDefaults: Record<string,string> = { BANK_TRANSFER: "007 450 0013991700300104 14", BINANCE_PAY: "13110721", PAYPAL: "transwbox2@gmail.com" };
export const paymentLabels: Record<string,string> = {BANK_TRANSFER:"Virement bancaire",BINANCE_PAY:"Binance Pay",PAYPAL:"PayPal"};
export async function paymentInstructions(method: string) {
 if(!(method in paymentDefaults)) return "";
 const setting=await db.appSetting.findUnique({where:{key:"PAYMENT_"+method}});
 return setting ? setting.value.trim() : paymentDefaults[method];
}
export function paymentAmounts(amount: number, method: string) {
 const feeAmount=method === "PAYPAL" ? Math.round(amount*5)/100 : 0;
 return {feeAmount,paidAmount:Math.round((amount+feeAmount)*100)/100};
}
