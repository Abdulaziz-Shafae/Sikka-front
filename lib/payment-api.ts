import {apiRequest} from './api-client';
export type PaymentOrder={visitId?:number|null;id:number;amountSar:number;status:'PENDING'|'PAID'|'FAILED';moyasarPaymentId:string|null;verifiedAt:string|null;failureReason:string|null};
export type PlanningPreview={members?:{visitMemberId:number;name:string;answerStatus:string;missingFields:string[];warnings:string[]}[];readyToGenerate:boolean;paymentRequired:boolean;freeRemaining:number;priceSar:number;entitlementStatus:string;missingFields:string[];warnings:string[]};
export function serverId(value:number|string){const n=Number(value);if(!Number.isSafeInteger(n)||n<=0)throw new Error('افتح الدفع من زيارة محفوظة في حسابك');return n;}
export function parseOrder(raw:unknown):PaymentOrder{
 if(!raw||typeof raw!=='object')throw new Error('تعذر قراءة طلب الدفع');const o=raw as PaymentOrder;
 if(!Number.isSafeInteger(o.id)||o.id<=0||!Number.isFinite(Number(o.amountSar))||Number(o.amountSar)<=0||!['PENDING','PAID','FAILED'].includes(o.status))throw new Error('بيانات طلب الدفع غير صالحة');
 return {...o,amountSar:Number(o.amountSar)};
}
export function paymentAmount(order:PaymentOrder){const amount=Math.round(order.amountSar*100);if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('قيمة الدفع غير صالحة');return amount;}
export const paymentApi={
 preview:(visitId:number)=>apiRequest(`/api/v1/visit/preview/${serverId(visitId)}`) as Promise<PlanningPreview>,
 orders:async(visitId:number):Promise<PaymentOrder[]>=>{const rows=await apiRequest(`/api/v1/payment-order/get/visit/${serverId(visitId)}`);if(!Array.isArray(rows))throw new Error('تعذر قراءة طلبات الدفع');return rows.map(parseOrder);},
 details:async(orderId:number)=>parseOrder(await apiRequest(`/api/v1/payment-order/get/details/${serverId(orderId)}`)),
 create:async(visitId:number)=>parseOrder(await apiRequest(`/api/v1/payment-order/add/${serverId(visitId)}`,'POST')),
 confirm:async(orderId:number,paymentId:string)=>{if(!/^[a-zA-Z0-9_-]{1,150}$/.test(paymentId))throw new Error('مرجع الدفع غير صالح');return parseOrder(await apiRequest(`/api/v1/payment-order/confirm/${serverId(orderId)}`,'POST',{paymentId}));},
};
export function checkoutConfiguration(order:PaymentOrder,publishableKey:string,callbackUrl:string){
 if(order.status!=='PENDING')throw new Error('طلب الدفع لا يقبل عملية جديدة');
 if(!/^pk_(test|live)_[a-zA-Z0-9_-]+$/.test(publishableKey))throw new Error('مفتاح الدفع العام غير مضبوط');
 const url=new URL(callbackUrl);if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('الدفع يتطلب اتصال HTTPS');
 return {amount:paymentAmount(order),currency:'SAR',description:`Sikka visit planning, order ${order.id}`,publishable_api_key:publishableKey,callback_url:url.href,metadata:{order_id:String(order.id)},methods:['creditcard']};
}
export async function confirmVisitPayment(orderId:number,paymentId:string,expectedVisitId?:number|string|null){
 const order=await paymentApi.confirm(orderId,paymentId);
 if(order.status!=='PAID'||!order.verifiedAt)throw new Error(order.failureReason||'لم يتأكد نجاح الدفع بعد؛ حدّث الحالة قبل المحاولة مجددًا.');
 const visitId=serverId(order.visitId||expectedVisitId||0);
 const orders=await paymentApi.orders(visitId);
 if(!orders.some(item=>item.id===order.id&&item.status==='PAID'&&item.verifiedAt))throw new Error('تعذر تحديد الزيارة المدفوعة؛ افتح الزيارة من حسابك وحدّث حالتها.');
 const preview=await paymentApi.preview(visitId);
 return {order,preview,visitId,returnUrl:`/connect?payment=success#visit/${visitId}/preview`};
}
