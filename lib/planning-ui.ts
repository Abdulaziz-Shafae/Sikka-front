import {rides, type Visit} from './sikka-data';
import {resizeFood,emptyFood} from './food-flow';

export type RidePriority='MUST_RIDE'|'PREFERRED'|'OPTIONAL';
export const priorityLabels:Record<RidePriority,string>={MUST_RIDE:'لازم أجربها',PREFERRED:'ودي أجربها',OPTIONAL:'إذا فيه وقت'};
export type ActivityRecord='ACTIVE'|'COMPLETED'|'SKIPPED';
export type UiActivity={key:string;planItemId?:number;rideId?:number;placeId?:number;rideSlug?:string;placeSlug?:string;title:string;kind:'RIDE'|'MEAL'|'SNACK'|'PRAYER'|'MEETING_POINT'|'PLACE';start:number;end:number;walking:number;waiting:number;duration:number;participants:string[];priority?:RidePriority;pinned?:boolean;records:Record<string,ActivityRecord>;startsAt?:string;endsAt?:string;rateable:boolean};
export type UiExclusion={rideSlug?:string;rideId?:number;title:string;member:string;priority:RidePriority;reasonCode:string;reason:string};
export type UiProposal={key:string;requestedBy:string;scope:'GROUP'|'INDIVIDUAL';activities:UiActivity[];excluded:UiExclusion[];reason:string};
export type UiPlan={source:'DEMO'|'SERVER';activities:UiActivity[];excluded:UiExclusion[];warnings:string[];proposal?:UiProposal;approved:boolean};
export function requestedRides(visit:Visit,member=visit.members[0]):{slug:string;priority:RidePriority}[]{
 const selected=visit.type==='FRIENDS'&&visit.together==='SPLIT'?(visit.memberSelections?visit.memberSelections[member]||[]:visit.selected.map(slug=>({slug,priority:visit.ridePriorities?.[slug]||'PREFERRED' as RidePriority}))):visit.selected.map(slug=>({slug,priority:visit.ridePriorities?.[slug]||'PREFERRED' as RidePriority}));
 return selected;
}
export function updateRideChoice(visit:Visit,member:string,slug:string,priority:RidePriority|null):Partial<Visit>{
 const rows=requestedRides(visit,member).filter(x=>x.slug!==slug);if(priority)rows.push({slug,priority});
 if(visit.type==='FRIENDS'&&visit.together==='SPLIT'){const memberSelections={...visit.memberSelections,[member]:rows};return {memberSelections,selected:[...new Set(Object.values(memberSelections).flat().map(x=>x.slug))],planning:undefined};}
 return {selected:rows.map(x=>x.slug),ridePriorities:Object.fromEntries(rows.map(x=>[x.slug,x.priority])),planning:undefined};
}
const rank:Record<RidePriority,number>={MUST_RIDE:0,PREFERRED:1,OPTIONAL:2};
// Deterministic UI fixtures only. Real eligibility, queue estimates and optimization belong to the backend.
export function buildDemoPlan(visit:Visit):UiPlan{
 const food=visit.food||resizeFood(emptyFood,visit.meal==='وجبة'||visit.meal==='وجبة وسناك'?1:0,visit.meal==='سناك'||visit.meal==='وجبة وسناك'?1:0);
 const breaks=food.breaks;const reserved=breaks.reduce((n,b)=>n+(b.kind==='MEAL'?60:30),0);const capacity=Math.max(0,Math.floor((visit.duration-reserved)/45));
 const members=visit.members.filter(m=>(visit.rsvps?.[m]||'GOING')==='GOING');const groups=visit.type==='FRIENDS'&&visit.together==='SPLIT'?members.map(m=>[m]):[members];
 const activities:UiActivity[]=[];const excluded:UiExclusion[]=[];let clock=0;
 if(!members.length)return {source:'DEMO',activities:[],excluded:[],approved:false,warnings:['نحتاج مشاركًا مؤكد الحضور قبل تجهيز الخطة.']};
 const foodAt=(phase:string)=>{for(const b of breaks.filter(x=>(x.timing==='AUTO'?'MIDDLE':x.timing)===phase)){const duration=b.kind==='MEAL'?60:30;if(clock+duration>visit.duration)continue;activities.push({key:b.key,title:b.restaurant||(b.kind==='MEAL'?'بريك وجبة':'بريك سناك'),kind:b.kind,start:clock,end:clock+duration,walking:0,waiting:0,duration,participants:members,records:{},rateable:!!b.restaurant});clock+=duration;}};
 const chosen=groups.map(group=>{const disliked=visit.type==='FRIENDS'&&visit.together==='SPLIT'?visit.memberDislikedFeatures?.[group[0]]||[]:visit.dislikedFeatures||[];const selected=group.length===1?requestedRides(visit,group[0]):requestedRides(visit);const candidates=[...selected,...rides.filter(r=>!selected.some(x=>x.slug===r.slug)).map(r=>({slug:r.slug,priority:'OPTIONAL' as RidePriority}))].filter(x=>!rides.find(r=>r.slug===x.slug)?.rideFeatures.some(f=>disliked.includes(f))).sort((a,b)=>rank[a.priority]-rank[b.priority]);const picked=candidates.slice(0,capacity);for(const member of group)for(const selection of selected.filter(x=>!picked.some(p=>p.slug===x.slug)))excluded.push({rideSlug:selection.slug,title:rides.find(r=>r.slug===selection.slug)?.name||selection.slug,member,priority:selection.priority,reasonCode:rides.find(r=>r.slug===selection.slug)?.rideFeatures.some(f=>disliked.includes(f))?'DEMO_PREFERENCE':'DEMO_CAPACITY',reason:rides.find(r=>r.slug===selection.slug)?.rideFeatures.some(f=>disliked.includes(f))?'تعارض مع خصائص اخترت تجنبها في المعاينة.':'لم تدخل ضمن مدة المعاينة بقيمها الافتراضية. السبب الحقيقي يتحدد من بيانات الخادم بعد الربط.'});return {group,picked};});
 foodAt('START');
 const hasMiddle=breaks.some(b=>b.timing==='MIDDLE'||b.timing==='AUTO');
 for(let phase=0;phase<(hasMiddle?2:1);phase++){
  let until=clock;
  for(const {group,picked} of chosen){let cursor=clock;const half=Math.ceil(picked.length/2);const rows=hasMiddle?(phase===0?picked.slice(0,half):picked.slice(half)):picked;for(const row of rows){if(cursor+45>visit.duration)continue;const ride=rides.find(r=>r.slug===row.slug);activities.push({key:`${group.join('|')}:${row.slug}`,rideSlug:row.slug,title:ride?.name||row.slug,kind:'RIDE',start:cursor,end:cursor+45,walking:10,waiting:20,duration:15,participants:group,priority:row.priority,records:{},rateable:true});cursor+=45;}until=Math.max(until,cursor);}
  clock=until;if(phase===0&&hasMiddle)foodAt('MIDDLE');
 }
 foodAt('END');
 const warnings=['هذه معاينة محلية: لكل لعبة 10د مشي و20د انتظار و15د نشاط افتراضية؛ ليست أوقاتًا فعلية أو نتيجة أهلية.'];if(reserved>visit.duration)warnings.push('مدة البريكات المطلوبة أكبر من الزيارة؛ عدّل المدة قبل التوليد الفعلي.');if(visit.prayer)warnings.push('مواقيت الصلاة غير متصلة. لا نعرض موعد صلاة افتراضيًا؛ يحجزها الخادم حسب يوم وموقع الزيارة.');
 return {source:'DEMO',activities:activities.sort((a,b)=>a.start-b.start),excluded,warnings,approved:visit.approved};
}
export function activityFinished(a:UiActivity,member?:string){const ids=member?[member]:a.participants;return ids.length>0&&ids.every(m=>['COMPLETED','SKIPPED'].includes(a.records[m]||''));}
export function recordActivity(plan:UiPlan,key:string,member:string,status:ActivityRecord):UiPlan{const a=plan.activities.find(x=>x.key===key);if(!a||!a.participants.includes(member))throw new Error('المشارك غير موجود في النشاط');return {...plan,activities:plan.activities.map(x=>x.key===key?{...x,records:{...x.records,[member]:status}}:x)};}
export function proposeDemoChange(plan:UiPlan,visit:Visit,member:string,reason:string):UiPlan{
 if(plan.proposal)throw new Error('راجع المقترح المعلّق أولًا');const scope=visit.together==='TOGETHER'||visit.type!=='FRIENDS'?'GROUP':'INDIVIDUAL';let changed=false;const cursors:Record<string,number>={};
 const activities=plan.activities.map(a=>{const editable=!a.pinned&&!['PRAYER','MEAL','SNACK','MEETING_POINT'].includes(a.kind)&&Object.keys(a.records).length===0&&(scope==='GROUP'||a.participants.length===1&&a.participants[0]===member);const waiting=a.waiting+(!changed&&editable&&a.kind==='RIDE'?10:0);if(waiting!==a.waiting)changed=true;const start=editable?Math.max(a.start,...a.participants.map(p=>cursors[p]||0)):a.start;const end=start+a.walking+waiting+a.duration;if(a.participants.some(p=>(cursors[p]||0)>start))throw new Error('التغيير يتعارض مع نشاط محفوظ؛ يلزم اقتراح آخر من الخادم');if(end>visit.duration)throw new Error('التعديل يتجاوز مدة الزيارة؛ وسّع المدة أو غيّر الاختيارات');a.participants.forEach(p=>cursors[p]=end);return {...a,start,end,waiting};});
 if(!changed)throw new Error('ما فيه نشاط مستقبلي قابل للتعديل ضمن نطاقك');return {...plan,proposal:{key:crypto.randomUUID(),requestedBy:member,scope,activities,excluded:plan.excluded,reason}};
}
export function respondToDemoProposal(plan:UiPlan,visit:Visit,member:string,approve:boolean):UiPlan{const p=plan.proposal;if(!p)throw new Error('ما فيه مقترح معلّق');const approver=p.scope==='GROUP'?visit.members[0]:p.requestedBy;if(member!==approver)throw new Error('الاعتماد متاح لصاحب الصلاحية فقط');return {...plan,activities:approve?p.activities:plan.activities,excluded:approve?p.excluded:plan.excluded,proposal:undefined};}
