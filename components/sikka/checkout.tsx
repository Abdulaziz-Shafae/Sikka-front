'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {BackendSignIn} from './backend-sign-in';
import {clearAuthentication,hasAuthentication,SikkaApiError} from '@/lib/api-client';
import {paymentApi,checkoutConfiguration,serverId,type PaymentOrder,type PlanningPreview} from '@/lib/payment-api';

declare global {interface Window {Moyasar?:{init:(options:Record<string,unknown>)=>void};}}
let assets:Promise<void>|undefined;
function loadMoyasar(){
 if(window.Moyasar)return Promise.resolve();if(assets)return assets;
 assets=new Promise<void>((resolve,reject)=>{
  if(!document.querySelector('[data-sikka-moyasar-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href='https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';link.dataset.sikkaMoyasarStyle='true';document.head.appendChild(link);}
  const script=document.createElement('script');script.src='https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';script.async=true;const timer=setTimeout(()=>{script.remove();assets=undefined;reject(new Error('تأخر تحميل نموذج الدفع؛ أعد المحاولة'));},20000);
  script.onload=()=>{clearTimeout(timer);if(window.Moyasar)resolve();else{assets=undefined;reject(new Error('تعذر تحميل نموذج الدفع'));}};
  script.onerror=()=>{clearTimeout(timer);script.remove();assets=undefined;reject(new Error('تعذر تحميل نموذج الدفع؛ أعد المحاولة'));};document.head.appendChild(script);
 });return assets;
}
export function Checkout({visitId,returning=false}:{visitId?:number;returning?:boolean}){
 const [authenticated,setAuthenticated]=useState(false);const [order,setOrder]=useState<PaymentOrder|null>(null);const [preview,setPreview]=useState<PlanningPreview|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [formReady,setFormReady]=useState(false);const [paymentId,setPaymentId]=useState('');const [returnedOrder,setReturnedOrder]=useState(0);const container=useRef<HTMLDivElement>(null);const operation=useRef(false);
 useEffect(()=>{setAuthenticated(hasAuthentication());if(returning){const query=new URLSearchParams(location.search);setPaymentId(query.get('id')||'');setReturnedOrder(Number(query.get('order')));}},[returning]);
 function fail(e:unknown){setError(e instanceof Error?e.message:'تعذر إكمال الطلب');if(e instanceof SikkaApiError&&e.status===401)setAuthenticated(false);}
 async function load(){if(operation.current)return;operation.current=true;setBusy(true);setError('');setFormReady(false);setOrder(null);try{const id=serverId(visitId||0);const current=await paymentApi.preview(id);setPreview(current);const orders=await paymentApi.orders(id);setOrder(orders.filter(o=>o.status==='PENDING').sort((a,b)=>b.id-a.id)[0]||(!current.paymentRequired?orders.filter(o=>o.status==='PAID').sort((a,b)=>b.id-a.id)[0]:null)||null);}catch(e){fail(e);}finally{operation.current=false;setBusy(false);}}
 async function pay(){if(operation.current)return;operation.current=true;setBusy(true);setError('');try{
  const key=process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY||'';
  if(!/^pk_(test|live)_/.test(key))throw new Error('الدفع غير متاح حاليًا؛ مفتاح الدفع العام غير مضبوط');
  const id=serverId(visitId||0);const current=await paymentApi.preview(id);setPreview(current);if(!current.paymentRequired)throw new Error('لا تحتاج دفعًا حاليًا. ارجع لتجهيز خطتك.');
  const orders=await paymentApi.orders(id);const pending=orders.filter(o=>o.status==='PENDING').sort((a,b)=>b.id-a.id)[0];const selected=pending?await paymentApi.details(pending.id):await paymentApi.create(id);setOrder(selected);
  const callback=new URL('/payment/return',location.origin);callback.searchParams.set('order',String(selected.id));
  const options=checkoutConfiguration(selected,key,callback.href);await loadMoyasar();if(!container.current)throw new Error('تعذر فتح نموذج الدفع');container.current.replaceChildren();
  window.Moyasar!.init({...options,element:container.current,on_failure:(message:string)=>setError(message||'لم تكتمل العملية. لا تعِد الدفع قبل مراجعة حالة طلبك.')});setFormReady(true);
 }catch(e){fail(e);}finally{operation.current=false;setBusy(false);}}
 async function confirm(){if(operation.current)return;operation.current=true;setBusy(true);setError('');try{const result=await paymentApi.confirm(serverId(returnedOrder),paymentId);setOrder(result);if(result.status!=='PAID'||!result.verifiedAt)throw new Error(result.failureReason||'لم يؤكد الخادم نجاح الدفع بعد. حدّث الحالة ولا تدفع مرة أخرى.');}catch(e){fail(e);}finally{operation.current=false;setBusy(false);}}
 useEffect(()=>{if(authenticated&&!returning)void load();},[authenticated,visitId,returning]);
 const paid=order?.status==='PAID'&&!!order.verifiedAt;
 return <main className="container page-space narrow-page" dir="rtl"><a className="text-link" href="/">ارجع لسكة</a><h1>{returning?'نتيجة الدفع':'إتمام دفع تخطيط الزيارة'}</h1><p>تذكرة المنتزه منفصلة. قيمة التخطيط واستحقاقك يحددهما حسابك في سكة.</p>
 {!authenticated?<BackendSignIn onAuthenticated={()=>{setAuthenticated(true);setError('');}}/>:<>
  <Button variant="ghost" onClick={()=>{clearAuthentication();setAuthenticated(false);setOrder(null);setPreview(null);setFormReady(false);container.current?.replaceChildren();}}>تسجيل الخروج</Button>
  {preview&&<section className="readiness-panel"><h2>{preview.paymentRequired?`${preview.priceSar} ر.س`:'ما عليك دفع حاليًا'}</h2><p>الفرص المجانية المتبقية: {preview.freeRemaining}</p>{preview.missingFields.length>0&&<p>باقي بيانات مطلوبة للزيارة؛ أكملها قبل توليد الخطة.</p>}</section>}
  {order&&<section className="readiness-panel"><h2>طلب رقم {order.id}</h2><p>{order.amountSar} ر.س · {order.status==='PAID'?'مدفوع':order.status==='FAILED'?'لم يكتمل الدفع':'بانتظار الدفع أو التحقق'}</p>{order.failureReason&&<p>{order.failureReason}</p>}</section>}
  {paid?<section className="readiness-panel" role="status"><h2>تم تأكيد الدفع من سكة</h2><p>ارجع لزياراتك وحدّث حالة التخطيط. لم نعلّم أي زيارة مدفوعة محليًا.</p><a href="/connect">افتح زياراتي</a></section>:returning?<section className="readiness-panel"><p>الرجوع من البنك وحده لا يؤكد نجاح الدفع؛ نراجع العملية مع سكة أولًا.</p><Button disabled={busy||!paymentId||!returnedOrder} onClick={confirm}>{busy?'نتحقق من العملية…':'تحقق من الدفع'}</Button>{(!paymentId||!returnedOrder)&&<p role="alert">رابط النتيجة ناقص. راجع طلباتك من حسابك قبل إعادة الدفع.</p>}</section>:<div className="readiness-actions"><Button disabled={busy||!preview?.paymentRequired||formReady} onClick={pay}>{busy?'نجهز الدفع…':order?.status==='PENDING'?'أكمل طلب الدفع':'ادفع بأمان'}</Button><Button variant="outline" disabled={busy} onClick={load}>تحديث حالة الطلب</Button></div>}
  <div ref={container} className="sikka-payment-form" hidden={!formReady||!authenticated}/>
 </>}{error&&<p className="readiness-panel" role="alert">{error}</p>}{process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.startsWith('pk_test_')&&<p>بيئة دفع تجريبية.</p>}
 </main>;
}
