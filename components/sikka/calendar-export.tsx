'use client';
import {useState} from 'react';
import {CalendarDays, ChevronLeft, ArrowRight, Download, ExternalLink, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {toast} from 'sonner';
import {type Visit,makeActivities} from '@/lib/sikka-data';

type Step='choose'|'manual';
const API=process.env.NEXT_PUBLIC_SIKKA_API_URL?.replace(/\/$/,'')||'';
const formatUtc=(d:Date)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const escapeIcs=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
function dateAtRiyadh(date:string,time:string){const [y,m,d]=date.split('-').map(Number);const [h,min]=time.split(':').map(Number);return new Date(Date.UTC(y,m-1,d,h-3,min));}
function schedule(visit:Visit){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(visit.date))throw new Error('حدد تاريخ الزيارة أولًا');
  const arrival=/^\d{2}:\d{2}$/.test(visit.arrival)?visit.arrival:'16:00';
  const start=dateAtRiyadh(visit.date,arrival);
  const end=new Date(start.getTime()+visit.duration*60000);
  const tasks=makeActivities(visit);
  const description=['جدول زيارتك من سكة | Sikka',...tasks.map(a=>{const at=new Date(start.getTime()+a.offset*60000);return at.toLocaleTimeString('ar-SA',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit'})+' - '+a.title;})].join('\n');
  return {start,end,description};
}
function demoGoogleLink(visit:Visit){
  const {start,end,description}=schedule(visit);
  const query=new URLSearchParams({action:'TEMPLATE',text:visit.name||'زيارة سكة إلى Six Flags Qiddiya',dates:formatUtc(start)+'/'+formatUtc(end),details:description,ctz:'Asia/Riyadh'});
  return 'https://calendar.google.com/calendar/render?'+query.toString();
}
function demoIcs(visit:Visit){
  const {start,end,description}=schedule(visit);
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sikka//Visit Calendar//AR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:sikka-demo-'+visit.id+'@sikka.app','DTSTAMP:'+formatUtc(new Date()),'DTSTART:'+formatUtc(start),'DTEND:'+formatUtc(end),'SUMMARY:'+escapeIcs(visit.name||'زيارة سكة'),'DESCRIPTION:'+escapeIcs(description),'END:VEVENT','END:VCALENDAR'];
  return lines.map(line=>{const chunks:string[]=[];let bytes=0;let current='';for(const ch of line){const size=new TextEncoder().encode(ch).length;if(bytes+size>74){chunks.push(current);current=' '+ch;bytes=1+size;}else{current+=ch;bytes+=size;}}chunks.push(current);return chunks.join('\r\n');}).join('\r\n')+'\r\n';
}
export function CalendarExport({visit}:{visit:Visit}){
  const [open,setOpen]=useState(false);
  const [step,setStep]=useState<Step>('choose');
  const [loading,setLoading]=useState(false);
  const backendId=/^\d+$/.test(visit.id)?Number(visit.id):null;
  async function google(){
    setLoading(true);
    try{
      let url=demoGoogleLink(visit);
      if(API&&backendId!==null){
        const response=await fetch(API+'/api/v1/google-calendar/manual/'+backendId,{credentials:'include'});
        if(!response.ok)throw new Error('ما قدرنا نجيب رابط التقويم من سكة، تأكد إنك مسجل دخول');
        const result=await response.json() as {url?:string};
        if(!result.url)throw new Error('رابط التقويم غير متاح');
        url=result.url;
      }
      window.open(url,'_blank','noopener,noreferrer');
      setOpen(false);
    }catch(error){toast.error(error instanceof Error?error.message:'تعذرت إضافة الموعد');}
    finally{setLoading(false);}
  }
  async function apple(){
    setLoading(true);
    try{
      let blob:Blob;
      if(API&&backendId!==null){
        const response=await fetch(API+'/api/v1/google-calendar/apple/'+backendId,{credentials:'include'});
        if(!response.ok)throw new Error('ما قدرنا ننزّل ملف Apple Calendar، تأكد إنك مسجل دخول');
        blob=await response.blob();
      }else blob=new Blob([demoIcs(visit)],{type:'text/calendar;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement('a');
      anchor.href=url;
      anchor.download='sikka-visit.ics';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      setOpen(false);
      toast.success('جهزنا ملف الزيارة لتقويم Apple');
    }catch(error){toast.error(error instanceof Error?error.message:'تعذر تجهيز ملف التقويم');}
    finally{setLoading(false);}
  }
  return <>
    <Button variant="outline" onClick={()=>{setStep('choose');setOpen(true);}}>أضف الزيارة للتقويم <CalendarDays size={16}/></Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader><DialogTitle>خل زيارتك على تقويمك</DialogTitle><DialogDescription>اختَر الطريقة اللي تناسبك عشان ما يفوتك شيء من طلعتك.</DialogDescription></DialogHeader>
        {step==='choose'?<div className="grid gap-3 py-2">
          <button type="button" className="flex items-center gap-3 rounded-xl border p-4 text-right hover:bg-muted/50" onClick={()=>setStep('manual')}><CalendarDays size={23}/><span className="flex-1"><strong className="block">أضيفها بنفسي</strong><small className="text-muted-foreground">جهزنا لك الموعد وأنت تحفظه</small></span><ChevronLeft size={18}/></button>
          <div className="flex items-center gap-3 rounded-xl border p-4 opacity-60" aria-disabled="true"><RefreshCw size={23}/><span className="flex-1"><strong className="block">اربط تقويم Google</strong><small className="text-muted-foreground">قريبًا — الربط والمزامنة التلقائية</small></span></div>
        </div>:<div className="grid gap-3 py-2">
          <button type="button" disabled={loading} className="flex items-center gap-3 rounded-xl border p-4 text-right hover:bg-muted/50 disabled:opacity-50" onClick={google}><ExternalLink size={22}/><span className="flex-1"><strong className="block">Google Calendar</strong><small className="text-muted-foreground">افتح الموعد واحفظه في Google</small></span><ChevronLeft size={18}/></button>
          <button type="button" disabled={loading} className="flex items-center gap-3 rounded-xl border p-4 text-right hover:bg-muted/50 disabled:opacity-50" onClick={apple}><Download size={22}/><span className="flex-1"><strong className="block">Apple Calendar</strong><small className="text-muted-foreground">حمّل ملف الزيارة بصيغة ICS</small></span><ChevronLeft size={18}/></button>
          <Button variant="ghost" disabled={loading} onClick={()=>setStep('choose')}> <ArrowRight size={16}/> رجوع </Button>
        </div>}
        {!API&&<p className="text-xs text-muted-foreground">هذه زيارة عرض محفوظة على الجهاز، والملف مبني على تفاصيلها الحالية.</p>}
      </DialogContent>
    </Dialog>
  </>;
}
