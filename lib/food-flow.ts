export const cuisines:Record<string,string>={NORTH_AMERICAN:'أمريكي',MIDDLE_EASTERN:'شرق أوسطي',MEXICAN:'مكسيكي',INDIAN:'هندي',ITALIAN:'إيطالي',PAN_ASIAN:'آسيوي',MULTINATIONAL:'عالمي'};
export const foodTimes={AUTO:'خل سكة تختار الوقت ✨',START:'بداية الطلعة',MIDDLE:'وسط الطلعة',END:'نهاية الطلعة'};
export type FoodBreak={key:string;kind:'MEAL'|'SNACK';timing:keyof typeof foodTimes;placeId?:number;restaurant?:string};
export type FoodPreferences={mealCount:number;snackCount:number;cuisineTypes:string[];breaks:FoodBreak[]};
export function resizeFood(p:FoodPreferences,mealCount:number,snackCount:number):FoodPreferences{return {...p,mealCount,snackCount,breaks:[...Array.from({length:mealCount},(_,i)=>({key:`meal-${i}`,kind:'MEAL' as const})),...Array.from({length:snackCount},(_,i)=>({key:`snack-${i}`,kind:'SNACK' as const}))].map(b=>p.breaks.find(x=>x.key===b.key)||{...b,timing:'AUTO'})};}
export const emptyFood:FoodPreferences={mealCount:0,snackCount:0,cuisineTypes:[],breaks:[]};
export function repeatDraft<T extends {id:string;date:string;paid:boolean;approved:boolean;completed:string[];ratings:Record<string,number>;status:string}>(v:T):T{return {...v,id:'',date:'',paid:false,approved:false,completed:[],ratings:{},planning:undefined,skipped:[],review:undefined,delayResponses:[],paymentState:undefined,status:'DRAFT'};}
