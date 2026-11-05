import type {Prisma} from "@prisma/client";
/** SMMKings offers return automatically when its recorded balance is positive. */
export const catalogAvailabilityWhere:Prisma.ServiceWhereInput={
 NOT:{mapping:{is:{primaryProvider:{is:{balance:{lte:0},OR:[{name:{contains:"smmking",mode:"insensitive"}},{apiUrl:{contains:"smmking",mode:"insensitive"}}]}}}}}
};
export function serviceAvailableForNewOrder(service:any){
 if(!service?.isActive||!service.mapping)return false;
 const provider=service.mapping.primaryProvider;
 if(!provider?.isActive)return false;
 const isSmmKings=(provider.name+" "+provider.apiUrl).toLowerCase().replace(/[\s_-]/g,"").includes("smmking");
 return !isSmmKings||Number(provider.balance)>0;
}
