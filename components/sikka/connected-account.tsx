'use client';
import Link from 'next/link';
import {useState} from 'react';
import {apiRequest,clearAuthentication,type CurrentAccount} from '@/lib/api-client';
import {paymentApi,type PlanningPreview} from '@/lib/payment-api';
import {BackendSignIn} from './backend-sign-in';
import {Button} from '@/components/ui/button';
type ServerVisit={id:number;name:string;visitDate:string;tripType:string;status:string;durationMinutes:number};
export function ConnectedAccount(){
 const [account,setAccount]=useState<CurrentAccount|null>(null);const [visits,setVisits]=useState<ServerVisit[]>([]);const [preview,setPreview]=useState<{visit:ServerVisit;data:PlanningPreview}|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function refresh(){setBusy(true);setError('');try{const rows=await apiRequest('/api/v1/visit/my-visits');if(!Array.isArray(rows)||rows.some(v=>!Number.isSafeInteger(v.id)||v.id<=0))throw new Error('تعذر قراءة الزيارات');setVisits(rows);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function inspect(visit:ServerVisit){setBusy(true);setError('');setPreview(null);try{setPreview({visit,data:await paymentApi.preview(visit.id)});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <main className="container page-space narrow-page"><a className="text-link" href="/">ارجع لسكة</a><h1>حسابك وزياراتك</h1>{!account?<BackendSignIn onAuthenticated={async a=>{setAccount(a);await refresh();}}/>:<><p>حيّاك {account.name}</p><div className="readiness-actions"><Button disabled={busy} onClick={refresh}>حدّث زياراتي</Button><Button variant="outline" onClick={()=>{clearAuthentication();setAccount(null);setVisits([]);setPreview(null);setError('');}}>تسجيل الخروج</Button></div>{busy&&<p role="status">نحمّل بياناتك…</p>}{!busy&&!visits.length&&<p>ما عندك زيارات محفوظة في الحساب حاليًا.</p>}{visits.map(v=><section className="readiness-panel" key={v.id}><h2>{v.name}</h2><p>{v.visitDate} · {v.durationMinutes} دقيقة · {v.status}</p><Button disabled={busy} variant="outline" onClick={()=>inspect(v)}>راجع جاهزية الزيارة والدفع</Button></section>)}{preview&&<section className="readiness-panel"><h2>{preview.visit.name}</h2><p>{preview.data.paymentRequired?`قيمة التخطيط ${preview.data.priceSar} ر.س`:'ما تحتاج دفع حاليًا'}</p><p>فرص مجانية: {preview.data.freeRemaining}</p><p>{preview.data.readyToGenerate?'الزيارة جاهزة للتوليد':'باقي متطلبات لتجهيز الزيارة'}</p>{preview.data.warnings.map((w,i)=><p key={i}>{w}</p>)}{preview.data.paymentRequired&&<Link className="text-link" href={`/checkout/${preview.visit.id}`}>افتح صفحة الدفع</Link>}</section>}</>}{error&&<p role="alert">{error}</p>}</main>;
}
