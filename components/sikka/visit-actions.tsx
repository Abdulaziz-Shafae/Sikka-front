'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {type Visit} from '@/lib/sikka-data';
export function VisitActions({visit,onEdit,onCancel,onDelete}:{visit:Visit;onEdit:()=>void;onCancel:()=>void;onDelete:()=>void}){
 const [action,setAction]=useState<'cancel'|'delete'|null>(null);
 return <><div className="readiness-actions">{visit.status==='DRAFT'&&<Button variant="outline" size="sm" onClick={onEdit}>تعديل التفاصيل</Button>}{!['CANCELLED','COMPLETED'].includes(visit.status)&&<Button variant="outline" size="sm" onClick={()=>setAction('cancel')}>إلغاء الزيارة</Button>}<Button variant="ghost" size="sm" onClick={()=>setAction('delete')}>حذف الزيارة</Button></div><Dialog open={!!action} onOpenChange={v=>{if(!v)setAction(null);}}><DialogContent className="sikka-dialog"><DialogHeader><DialogTitle>{action==='delete'?'نحذف زيارة العرض؟':'نلغي الزيارة؟'}</DialogTitle><DialogDescription>{action==='delete'?'تحذف هذه الزيارة وسجلها من هذا الجهاز فقط، وبقية زياراتك تبقى.':'تظل الزيارة محفوظة كملغاة، وتقدر تكررها لمسودة جديدة.'}</DialogDescription></DialogHeader><Button variant="destructive" onClick={()=>{if(action==='delete')onDelete();else onCancel();setAction(null);}}>تأكيد {action==='delete'?'الحذف':'الإلغاء'}</Button><Button variant="outline" onClick={()=>setAction(null)}>رجوع</Button></DialogContent></Dialog></>;
}
