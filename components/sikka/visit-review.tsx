'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {StarRating} from './star-rating';
import {backendApi} from '@/lib/backend-contract';
import {liveApi} from '@/lib/live-api';
import {completedPosterRides,posterPages,type PosterRide} from '@/lib/visit-poster';
import {VisitSummaryPoster} from './visit-summary-poster';
import type {Mutate} from './live-forms';

export function VisitReview({visitId,accountId,busy,mutate}:{visitId:number;accountId:number;busy:boolean;mutate:Mutate}){
 const key=`sikka-review:${accountId}:${visitId}`;
 const [finished,setFinished]=useState(false);
 const [poster,setPoster]=useState<{rides:PosterRide[];visitName:string;visitDate:string}|null>(null);
 const [loadingPoster,setLoadingPoster]=useState(true),[posterError,setPosterError]=useState('');
 useEffect(()=>{try{setFinished(localStorage.getItem(key)==='done');}catch{}},[key]);
 useEffect(()=>{
  let cancelled=false;setLoadingPoster(true);setPosterError('');setPoster(null);
  Promise.all([backendApi.visitSummary(visitId),liveApi.records(visitId),liveApi.visit(visitId),liveApi.rides()])
   .then(([summary,records,visit,rides])=>{
    if(cancelled)return;
    if(visit.status!=='COMPLETED'||summary.visitId!==visitId)throw new Error('ملخص الزيارة غير متاح قبل اكتمالها.');
    const completed=completedPosterRides(records,rides,summary.visitMemberId);
    if(completed.length!==summary.completedRidesCount)throw new Error('بيانات الألعاب المكتملة غير متطابقة؛ حدّث الصفحة وحاول مرة ثانية.');
    setPoster({rides:completed,visitName:visit.name,visitDate:visit.visitDate});
   }).catch(e=>{if(!cancelled)setPosterError(e instanceof Error?e.message:'تعذر تحميل ملخص الزيارة.');})
   .finally(()=>{if(!cancelled)setLoadingPoster(false);});
  return()=>{cancelled=true;};
 },[visitId,accountId]);
 function finish(){try{localStorage.setItem(key,'done');}catch{}setFinished(true);}
 const pages=poster?posterPages(poster.rides):[];
 return <section>
  <h2>ملخص زيارتك</h2>
  {loadingPoster&&<p role="status">نحمّل الألعاب المكتملة من سكة…</p>}
  {posterError&&<p role="alert">{posterError} ما بنعرض بيانات تخمينية.</p>}
  {poster&&!poster.rides.length&&<p>ما عندك ألعاب مكتملة مسجلة لهذه الزيارة.</p>}
  {pages.map((rides,index)=><VisitSummaryPoster key={index} rides={rides} visitName={poster!.visitName} visitDate={poster!.visitDate} pageIndex={index}/>)}
  {finished?<p role="status">تقييم الطلعة اختياري. نتمنى لكم أونس مغامرة ✨</p>:<>
   <h2>كيف الطلعة معاك؟</h2>
   <form className="profile-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void mutate(async()=>{await backendApi.review(visitId,{rating:Number(f.get('rating')),review:String(f.get('review')),sikkaRating:Number(f.get('sikkaRating')),sikkaReview:String(f.get('sikkaReview'))});finish();},'تم حفظ تقييمك');}}>
    <StarRating name="rating" label="كيف الطلعة معاك؟" disabled={busy}/>
    <Input name="review" placeholder="رأيك بالطلعة"/>
    <StarRating name="sikkaRating" label="كيف سكة معاك؟" disabled={busy}/>
    <Input name="sikkaReview" placeholder="وش نطوّر في سكة؟"/>
    <div className="readiness-actions"><Button disabled={busy} type="submit">قيّم</Button><Button disabled={busy} variant="outline" type="button" onClick={finish}>مو حاب أقيّم</Button></div>
   </form>
  </>}
 </section>;
}
