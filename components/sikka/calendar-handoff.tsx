'use client';
import {useState} from 'react';
import {CalendarDays} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
export function CalendarHandoff(){
 const [open,setOpen]=useState(false);
 return <><Button variant="outline" onClick={()=>setOpen(true)}><CalendarDays size={16}/>أضف الزيارة للتقويم</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="sikka-dialog"><DialogHeader><DialogTitle>الزيارة في تقويمك</DialogTitle><DialogDescription>هذه زيارة تجريبية محفوظة على جهازك. خيارات التقويم تتاح بعد ربط حسابك وزيارة حقيقية بالخادم.</DialogDescription></DialogHeader><h3>أضيفها بنفسي</h3><Button variant="outline" disabled>Google Calendar · قريبًا</Button><Button variant="outline" disabled>Apple Calendar · ملف ICS قريبًا</Button><h3>اربط تقويم Google</h3><p className="inline-note">حالة الربط غير متاحة في نسخة العرض. لم تتم إضافة أو مزامنة أي حدث.</p><Button variant="outline" disabled>ربط Google · قريبًا</Button><Button onClick={()=>setOpen(false)}>رجوع للخطة</Button></DialogContent></Dialog></>;
}
