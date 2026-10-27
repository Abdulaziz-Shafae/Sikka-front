'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {StarRating} from './star-rating';
import {backendApi} from '@/lib/backend-contract';
import type {Mutate} from './live-forms';
export function VisitReview({visitId,accountId,busy,mutate}:{visitId:number;accountId:number;busy:boolean;mutate:Mutate}){
 const key=`sikka-review:${accountId}:${visitId}`;
 const [finished,setFinished]=useState(false);
 useEffect(()=>{try{setFinished(localStorage.getItem(key)==='done');}catch{}},[key]);
 function finish(){try{localStorage.setItem(key,'done');}catch{}setFinished(true);}
 if(finished)return <p role="status">تقييم الطلعة اختياري. نتمنى لكم أونس مغامرة ✨</p>;
 return <><h2>كيف الطلعة معاك؟</h2><form className="profile-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void mutate(async()=>{await backendApi.review(visitId,{rating:Number(f.get('rating')),review:String(f.get('review')),sikkaRating:Number(f.get('sikkaRating')),sikkaReview:String(f.get('sikkaReview'))});finish();},'تم حفظ تقييمك');}}><StarRating name="rating" label="كيف الطلعة معاك؟" disabled={busy}/><Input name="review" placeholder="رأيك بالطلعة"/><StarRating name="sikkaRating" label="كيف سكة معاك؟" disabled={busy}/><Input name="sikkaReview" placeholder="وش نطوّر في سكة؟"/><div className="readiness-actions"><Button disabled={busy} type="submit">قيّم</Button><Button disabled={busy} variant="outline" type="button" onClick={finish}>مو حاب أقيّم</Button></div></form></>;
}
