'use client';

import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {liveApi,type LiveVisit,type RecordRow} from '@/lib/live-api';
import {formatNoticeTime} from '@/lib/notification-time';

function minutesBetween(start:string|null|undefined,end:string|null|undefined){
 if(!start||!end)return null;
 const first=new Date(start+'+03:00'),last=new Date(end+'+03:00');
 if(Number.isNaN(first.getTime())||Number.isNaN(last.getTime())||last<first)return null;
 return Math.floor((last.getTime()-first.getTime())/60000);
}
export function LiveVisitRecap({visit,onBack}:{visit:LiveVisit;onBack:()=>void}){
 const [records,setRecords]=useState<RecordRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{let alive=true;void liveApi.records(visit.id).then(rows=>{if(alive){setRecords(rows);setError('');}}).catch(()=>{if(alive)setError('ما قدرنا نجيب الألعاب المكتملة. جرّب تفتح الصفحة مرة ثانية.');}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[visit.id]);
 const completed=records.filter(r=>r.status==='COMPLETED'&&r.rideId&&r.completedAt).sort((a,b)=>(a.completedAt||'').localeCompare(b.completedAt||''));
 const duration=minutesBetween(visit.startedAt,visit.completedAt);
 return <section className="readiness-panel" dir="rtl">
  <h2>يا سلام على سكتكم! 🚂🎉</h2>
  <p>هذا ملخص الألعاب اللي جربتوها فعلًا، مو الألعاب المخطط لها.</p>
  <div className="readiness-metrics"><span>{visit.visitDate}</span><span>{completed.length} ألعاب مكتملة</span>{duration!==null&&<span>{Math.floor(duration/60)} ساعة و{duration%60} دقيقة</span>}</div>
  {loading&&<p role="status">نجهّز الملخص…</p>}
  {error&&<p role="alert">{error}</p>}
  {!loading&&!error&&completed.length===0&&<p>ما فيه ألعاب مكتملة ومسجّلة لهذا المشارك.</p>}
  <ol className="grid gap-3">{completed.map((r,index)=><li key={r.id} className="rounded-xl border p-3"><strong>{index+1}. {r.rideName||'لعبة'}</strong><p>{formatNoticeTime(r.completedAt)?.time||'الوقت غير متوفر'}</p></li>)}</ol>
  <p className="text-sm">صورة سكة التذكارية بتضاف بعد اعتماد قالب الصورة النهائي.</p>
  <Button variant="outline" onClick={onBack}>ارجع للزيارة</Button>
 </section>;
}
