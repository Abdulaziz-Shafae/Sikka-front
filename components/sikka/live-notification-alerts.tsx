'use client';

import {useEffect,useRef,useState} from 'react';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogDescription,DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {backendApi,type ApiPlanDetails} from '@/lib/backend-contract';
import {liveApi,request,type Notice,type Place} from '@/lib/live-api';
import {SikkaApiError} from '@/lib/api-client';

const reasons=[['rest','أخذنا راحة'],['wait','انتظار أطول'],['extra','لعبة خارج الخطة'],['other','سبب ثاني']] as const;
const cuisines=[['burger','برجر'],['pizza','بيتزا'],['chicken','دجاج'],['grill','مشاوي'],['light','شي خفيف'],['any','أي شيء']] as const;
const mealKeywords:Record<string,RegExp>={
 burger:/برجر|burger/i,pizza:/بيتزا|pizza/i,chicken:/دجاج|chicken/i,
 grill:/مشاوي|grill|barbecue|bbq|كباب/i,light:/سلطة|salad|light|خفيف/i
};
const cuisineCodes:Record<string,string[]>={
 burger:['NORTH_AMERICAN','MULTINATIONAL'],
 pizza:['ITALIAN'],
 chicken:['NORTH_AMERICAN','INDIAN','MULTINATIONAL'],
 grill:['MIDDLE_EASTERN'],
 light:['MULTINATIONAL','MIDDLE_EASTERN']
};
function isInteractive(n:Notice){return !n.respondedAt&&['ACTIVITY_DELAY','REPLAN_APPROVAL_REQUEST','MEAL_RESTAURANT_REMINDER'].includes(n.type);}
function isMajorRide(n:Notice){return n.actionType==='RIDE_CLOSED'||n.actionType==='RIDE_WAIT_MAJOR';}

export function LiveNotificationAlerts({accountId,onVisit}:{accountId:number;onVisit:(visitId:number)=>void}){
 const [items,setItems]=useState<Notice[]>([]);
 const [dismissed,setDismissed]=useState<Set<number>>(new Set());
 const [reason,setReason]=useState('');
 const [other,setOther]=useState('');
 const [cuisine,setCuisine]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [proposal,setProposal]=useState<ApiPlanDetails|null>(null);
 const seen=useRef<Set<number>>(new Set());
 const initialized=useRef(false);

 useEffect(()=>{
  let live=true;
  seen.current=new Set();initialized.current=false;setDismissed(new Set());setItems([]);
  const poll=async()=>{
   if(document.hidden)return;
   try{
    const notices=await liveApi.notices();
    if(!live)return;
    const fresh=notices.filter(n=>!n.readAt&&!seen.current.has(n.id)&&(n.actionType==='RIDE_WAIT_MINOR'||['PLAN_APPROVAL_RESULT','REPLAN_RESULT','ALL_MEMBERS_RESPONDED'].includes(n.type)));
    if(initialized.current)for(const n of fresh)toast.info(n.title||'تغير وقت انتظار لعبة',{description:n.message});
    for(const n of notices)seen.current.add(n.id);
    initialized.current=true;
    setItems(notices);
   }catch{ /* The inbox offers manual retry. A polling failure must not interrupt the visit. */ }
  };
  void poll();
  const timer=setInterval(()=>void poll(),60000);
  return()=>{live=false;clearInterval(timer);};
 },[accountId]);

 const current=items.find(n=>n.visitId&&!(dismissed.has(n.id))&&!n.readAt&&(isInteractive(n)||isMajorRide(n)))||null;
 useEffect(()=>{
  let cancelled=false;
  setProposal(null);setError('');setReason('');setOther('');setCuisine('');
  if(!current||current.type!=='REPLAN_APPROVAL_REQUEST'||!current.visitId)return;
  void request<ApiPlanDetails>('visit-plan/get/pending-group-plan/'+current.visitId).then(plan=>{
   if(!cancelled)setProposal(plan);
  }).catch(()=>{if(!cancelled)setError('تعذر تحميل تفاصيل المقترح. افتح الخطة للمراجعة.');});
  return()=>{cancelled=true;};
 },[current?.id]);

 function close(){if(current){setDismissed(previous=>new Set([...previous,current.id]));setError('');}}
 async function run(job:()=>Promise<void>){
  if(busy)return;
  setBusy(true);setError('');
  try{await job();close();}catch(e){setError(e instanceof Error?e.message:'ما قدرنا نكمل الإجراء، جرّب مرة ثانية.');}finally{setBusy(false);}
 }
 async function markRead(){if(!current)return;await liveApi.readNotice(current.id);}
 async function respondDelay(){
  if(!current)return;
  const value=reason==='other'?other.trim():reasons.find(v=>v[0]===reason)?.[1];
  if(!value)throw new Error('اختَر سبب التأخير أولًا.');
  await backendApi.respondDelay(current.id,value,false);
  await markRead();
 }
 async function respondProposal(approve:boolean){
  if(!current||!proposal?.pendingProposal)throw new Error('المقترح غير متاح الآن.');
  if(approve)await backendApi.approve(proposal.plan.id,proposal.pendingProposal.proposalKey);
  else await backendApi.reject(proposal.plan.id,proposal.pendingProposal.proposalKey);
  await markRead();
 }
 async function selectRestaurant(){
  if(!current?.visitId||!current.planItemId)throw new Error('بريك الأكل غير مرتبط بالخطة.');
  if(!cuisine)throw new Error('اختَر نوع الأكل.');
  const visitId=current.visitId;
  const [meals,places,plan,rides]=await Promise.all([liveApi.mealBreaks(visitId),liveApi.places(),liveApi.groupPlan(visitId),liveApi.rides()]);
  const meal=meals.find(m=>m.planItemId===current.planItemId&&!m.placeId);
  if(!meal)throw new Error('تم اختيار مطعم من قبل، أو انتهى وقت اختيار المطعم.');
  const matching=places.filter(p=>p.kind==='RESTAURANT'&&p.status==='OPEN'&&(cuisine==='any'||mealKeywords[cuisine]?.test(p.name+' '+(p.description||''))||p.cuisineTypes?.some(code=>(cuisineCodes[cuisine]||[]).includes(code))));
  if(!matching.length)throw new Error('ما لقينا مطعمًا مفتوحًا ومؤكدًا لهذا النوع. اختَر نوعًا ثانيًا أو ابحث يدويًا.');
  const food=plan.planItems.find(a=>a.id===meal.planItemId);
  const before=plan.planItems.filter(a=>a.rideId&&food&&a.sortOrder<food.sortOrder).sort((a,b)=>b.sortOrder-a.sortOrder)[0];
  const origin=rides.find(r=>r.id===before?.rideId);
  const coordinate=(value:number|null|undefined)=>value===undefined||value===null?null:Number(value);
  const x=coordinate(origin?.mapX),y=coordinate(origin?.mapY);
  const score=(place:Place)=>{
   const px=coordinate(place.mapX),py=coordinate(place.mapY);
   if(x!==null&&y!==null&&px!==null&&py!==null)return (x-px)**2+(y-py)**2;
   return place.land&&origin?.land&&place.land===origin.land?0:1;
  };
  matching.sort((a,b)=>score(a)-score(b)||a.id-b.id);
  // Final timetable, walking-route availability and shared-party permissions are verified by Spring Boot.
  let chosen=false;
  // A restaurant with a matching cuisine can still lack a verified route or fit poorly in the schedule.
  // Only those server-validated failures trigger the next nearby candidate.
  for(const option of matching.slice(0,8)){
   try{await liveApi.restaurant(visitId,meal.breakKey,option.id);chosen=true;break;}
   catch(error){if(!(error instanceof SikkaApiError&&error.status===400))throw error;}
  }
  if(!chosen)throw new Error('ما لقينا مطعمًا مناسبًا يطابق المسار والوقت. اختَر نوعًا ثانيًا أو حدد مطعمًا يدويًا.');
  await markRead();
 }
 async function applyRideAction(action:'DEFER'|'REPLACE'|'KEEP'|'ADJUST') {
  if(!current)throw new Error('التنبيه غير موجود.');
  const response=await request<{message:string}>(`notification/ride-action/${current.id}/${action}`,'PUT');
  toast.success(response.message||'تم تحديث سكتكم');
  setItems(items=>items.map(n=>n.id===current.id?{...n,readAt:new Date().toISOString(),respondedAt:new Date().toISOString()}:n));
  if(current.visitId)onVisit(current.visitId);
 }
 return <Dialog open={!!current} onOpenChange={open=>{if(!open)close();}}>
  <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto" showCloseButton={!busy}>
   <DialogTitle>{current?.title||'تنبيه من سكة'}</DialogTitle>
   <DialogDescription>{current?.message}</DialogDescription>
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   {current?.type==='ACTIVITY_DELAY'&&<div className="grid grid-cols-2 gap-2">
    {reasons.map(([id,label])=><button key={id} type="button" aria-pressed={reason===id} disabled={busy} onClick={()=>setReason(id)} className="rounded-xl border p-3 text-sm font-semibold" style={reason===id?{background:'#FFC928',color:'#183153',borderColor:'#FFC928'}:{}}>{label}</button>)}
    {reason==='other'&&<div className="col-span-2"><Input aria-label="سبب آخر" placeholder="اكتب السبب..." value={other} maxLength={500} onChange={e=>setOther(e.target.value)}/></div>}
    <Button className="col-span-2" disabled={busy||!reason||(reason==='other'&&!other.trim())} onClick={()=>void run(respondDelay)}>تأكيد</Button>
   </div>}
   {current?.type==='REPLAN_APPROVAL_REQUEST'&&<div className="grid gap-3">
    {proposal?.pendingProposal?<><div className="grid gap-3 sm:grid-cols-2">
     <section className="rounded-lg border p-3"><h3 className="font-semibold">الخطة الحالية</h3>{proposal.planItems.slice(0,12).map(x=><p className="text-xs py-1" key={x.id}>{x.title} · {x.startsAt?.slice(11,16)||'—'}</p>)}</section>
     <section className="rounded-lg border p-3"><h3 className="font-semibold">التعديل المقترح</h3>{proposal.proposedPlanItems.slice(0,12).map((x,i)=><p className="text-xs py-1" key={i}>{x.title} · {x.startsAt?.slice(11,16)||'—'}</p>)}</section>
    </div><div className="grid grid-cols-2 gap-2"><Button disabled={busy} variant="outline" onClick={()=>void run(()=>respondProposal(false))}>رفض التعديل</Button><Button disabled={busy} onClick={()=>void run(()=>respondProposal(true))}>اعتماد التعديل</Button></div></>:<p className="text-sm">حمّل المقترح من صفحة الخطة إذا ما ظهر هنا.</p>}
   </div>}
   {current?.type==='MEAL_RESTAURANT_REMINDER'&&<div className="grid grid-cols-3 gap-2">
    {cuisines.map(([id,label])=><button key={id} type="button" aria-pressed={cuisine===id} disabled={busy} onClick={()=>setCuisine(id)} className="rounded-xl border p-3 text-sm font-semibold" style={cuisine===id?{background:'#FFC928',color:'#183153',borderColor:'#FFC928'}:{}}>{label}</button>)}
    <Button className="col-span-3" disabled={busy||!cuisine} onClick={()=>void run(selectRestaurant)}>اختَر لنا مطعمًا</Button>
   </div>}
   {current?.type==='RIDE_STATUS_CHANGED'&&<div className="grid grid-cols-2 gap-2">
    <Button variant="outline" disabled={busy} onClick={()=>void run(()=>applyRideAction('DEFER'))}>نروح للي بعدها</Button>
    <Button disabled={busy} onClick={()=>void run(()=>applyRideAction('REPLACE'))}>اختَر بديل تلقائيًا</Button>
   </div>}
   {current?.actionType==='RIDE_WAIT_MAJOR'&&<div className="grid gap-2">
    <Button variant="outline" disabled={busy} onClick={()=>void run(()=>applyRideAction('KEEP'))}>نكمل نفس الخطة</Button>
    <Button disabled={busy} onClick={()=>void run(()=>applyRideAction('REPLACE'))}>نبدّل اللعبة</Button>
    <Button variant="outline" disabled={busy} onClick={()=>void run(()=>applyRideAction('ADJUST'))}>نعدّل الخطة</Button>
   </div>}
   <Button type="button" variant="ghost" disabled={busy} onClick={close}>مو الحين</Button>
  </DialogContent>
 </Dialog>;
}
