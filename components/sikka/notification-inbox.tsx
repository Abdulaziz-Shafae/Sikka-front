'use client';
import {useEffect,useState} from 'react';
import {Bell,Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {type Visit} from '@/lib/sikka-data';
export function NotificationInbox({visits,onOpen}:{visits:Visit[];onOpen:(visit:Visit)=>void}){
 const [read,setRead]=useState<string[]>([]);useEffect(()=>{try{setRead(JSON.parse(localStorage.getItem('sikka-demo-read')||'[]'));}catch{}},[]);
 function mark(key:string){const next=[...new Set([...read,key])];setRead(next);localStorage.setItem('sikka-demo-read',JSON.stringify(next));}
 const rows=visits.map(v=>({visit:v,key:v.id+':'+v.status,title:v.status==='COMPLETED'?'ملخص زيارتك جاهز':v.planning?.proposal?'فيه مقترح يحتاج مراجعة':v.approved?'الخطة معتمدة':'راجع تجهيز الزيارة'}));
 return <div className="container page-space narrow-page"><h1>آخر أخبار سكتك</h1><p>تحديثات العرض المحلي؛ إرسال البريد وواتساب والتنبيهات الزمنية يشتغل بعد الربط.</p><Button variant="outline" disabled={!rows.length} onClick={()=>{const next=[...new Set([...read,...rows.map(x=>x.key)])];setRead(next);localStorage.setItem('sikka-demo-read',JSON.stringify(next));}}><Check size={15}/>قراءة الكل</Button>{!rows.length&&<div className="readiness-panel">ما فيه تنبيهات حاليًا. جهّز زيارة وتظهر تحديثاتها هنا.</div>}{rows.map(x=><article className="readiness-panel" key={x.key}><h2><Bell size={18}/>{x.title}{!read.includes(x.key)&&<span className="soft-badge">جديد</span>}</h2><p>{x.visit.name} · {x.visit.date}</p><div className="readiness-actions"><Button onClick={()=>{mark(x.key);onOpen(x.visit);}}>افتح الزيارة</Button><Button variant="outline" disabled={read.includes(x.key)} onClick={()=>mark(x.key)}>تمت القراءة</Button></div></article>)}</div>;
}
