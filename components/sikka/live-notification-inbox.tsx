'use client';

import {Bell,CalendarDays,Clock3,Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {formatNoticeTime} from '@/lib/notification-time';
import {type Notice} from '@/lib/live-api';

export function LiveNotificationInbox({notices,busy,loading,onReload,onRead,onOpen}:{notices:Notice[];busy:boolean;loading:boolean;onReload:()=>void;onRead:(id:number)=>void;onOpen:(visitId:number)=>void}){
 return <section className="narrow-page" dir="rtl">
  <div className="sikka-notification-heading">
   <h1>آخر أخبار سكتك</h1>
   <Button variant="outline" disabled={busy||loading} onClick={onReload}>تحديث</Button>
  </div>
  {loading&&<p role="status">نحمّل التنبيهات…</p>}
  {!loading&&!notices.length&&<div className="sikka-notification-card">ما عندك تنبيهات حاليًا.</div>}
  {notices.map(notice=>{
   const time=formatNoticeTime(notice.sentAt||notice.createdAt);
   return <article className="sikka-notification-card" key={notice.id}>
    <div className="sikka-notification-card-head">
     <h2><Bell size={19} aria-hidden="true"/>{notice.title}</h2>
     {!notice.readAt&&<span className="sikka-notification-new">جديد</span>}
    </div>
    <p className="sikka-notification-message">{notice.message}</p>
    {time&&<div className="sikka-notification-timestamp">
     <span><CalendarDays size={16} aria-hidden="true"/>{time.day}</span>
     <span><Clock3 size={16} aria-hidden="true"/><time dateTime={notice.sentAt||notice.createdAt||undefined}>{time.time}</time></span>
    </div>}
    <div className="sikka-notification-actions">
     {notice.visitId&&<Button disabled={busy} onClick={()=>onOpen(notice.visitId!)}>افتح الزيارة</Button>}
     <Button variant="outline" disabled={busy||!!notice.readAt} onClick={()=>onRead(notice.id)}><Check size={15}/>{notice.readAt?'تمت القراءة':'تمت القراءة'}</Button>
    </div>
    {notice.actionType==='RESPOND_DELAY'&&!notice.respondedAt&&<p className="text-sm">تقدر تجاوب عن سبب التأخير من التنبيه التفاعلي.</p>}
   </article>;
  })}
 </section>;
}
