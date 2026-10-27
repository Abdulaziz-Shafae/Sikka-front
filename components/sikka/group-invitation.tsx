'use client';
import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {extractInviteCode} from '@/lib/live-visit-flow';
import {liveApi,request,type LiveVisit,type Member} from '@/lib/live-api';
import {arabicMessage} from '@/lib/arabic-messages';
import type {Mutate} from './live-forms';
export function GroupInvitation({visit,accountId,members,busy,mutate}:{visit:LiveVisit;accountId:number;members:Member[];busy:boolean;mutate:Mutate}){
 const [code,setCode]=useState(''),[link,setLink]=useState(''),[qrFailed,setQrFailed]=useState(false);
 const leader=visit.organizerAccountId===accountId,key=`sikka-invite:${accountId}:${visit.id}`;
 useEffect(()=>{setCode(leader?sessionStorage.getItem(key)||'':'');setLink('');setQrFailed(false);},[key,leader]);
 useEffect(()=>{let active=true;setQrFailed(false);if(!leader||!code)return;request<{message:string}>(`visit-group/link/${visit.id}?code=${encodeURIComponent(code)}`).then(result=>{if(active){const value=new URL(result.message);if(value.origin===location.origin&&(value.protocol==='https:'||['localhost','127.0.0.1'].includes(value.hostname)))setLink(value.toString());else toast.info('رابط الدعوة غير متاح حاليًا؛ تقدر تشارك رمز الدعوة.');}}).catch(e=>{if(active)toast.error(arabicMessage(e));});return()=>{active=false;};},[leader,code,visit.id]);
 async function regenerate(){await mutate(async()=>{const result=await liveApi.regenerateCode(visit.id);const next=extractInviteCode(result.message);if(!next)throw new Error('تعذر قراءة رمز الدعوة الجديد');sessionStorage.setItem(key,next);setCode(next);setLink('');},'تم إنشاء رمز دعوة جديد');}
 async function copy(value:string){try{await navigator.clipboard.writeText(value);toast.success('تم النسخ');}catch{toast.info('ما قدرنا ننسخ تلقائيًا؛ حدد الرمز وانسخه يدويًا.');}}
 const editable=visit.status==='DRAFT'&&!visit.membersLocked;
 return <section className="readiness-panel" aria-label="معلومات القروب"><h2>قروب {visit.name}</h2><p>{members.length} مشارك · {members.filter(m=>m.rsvpStatus==='GOING').length} مؤكد حضورهم</p>{leader&&<>{code&&<div className="invitation-code"><div><p>رمز الدعوة</p><code>{code}</code></div><Button type="button" variant="outline" onClick={()=>copy(code)}>انسخ الرمز</Button>{link&&<Button type="button" variant="outline" onClick={()=>copy(link)}>انسخ رابط الدعوة</Button>}{link&&!qrFailed&&<img width={160} height={160} alt="باركود الانضمام للقروب" src={`${process.env.NEXT_PUBLIC_SIKKA_API_URL||'/api/backend'}/api/v1/visit-group/qr/${visit.id}?code=${encodeURIComponent(code)}`} onError={()=>{setQrFailed(true);toast.info('تعذر عرض الباركود؛ تقدر تستخدم رمز الدعوة أو الرابط.');}}/>}</div>}{editable&&<Button type="button" disabled={busy} variant="outline" onClick={()=>{if(code)toast.info('إنشاء رمز جديد يلغي رمز الدعوة السابق.',{action:{label:'أنشئ رمزًا جديدًا',onClick:()=>{void regenerate();}}});else void regenerate();}}>{code?'إنشاء رمز دعوة جديد':'إظهار رمز دعوة جديد'}</Button>}{!code&&editable&&<p>إذا ما عندك الرمز الحالي، تقدر تنشئ رمز دعوة جديدًا.</p>}</>}{!editable&&<p>استقبال مشاركين جدد متوقف بعد اعتماد الخطة.</p>}</section>;
}
