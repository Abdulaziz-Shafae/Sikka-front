'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {type Visit} from '@/lib/sikka-data';
export function PaymentPreview({visit,onBack}:{visit:Visit;onBack:()=>void}){
 const [state,setState]=useState<'REQUIRED'|'PENDING'|'FAILED'|'VERIFIED'>('REQUIRED');
 return <div className="container page-space narrow-page"><span className="soft-badge">معاينة حالات الدفع</span><h1>نجهّز سكتك</h1><div className="readiness-panel"><h2>{visit.name}</h2><p>قيمة الخدمة وعدد الفرص المجانية يحددهما الخادم عند الربط. تذكرة المنتزه منفصلة.</p><div role="status"><h3>{state==='REQUIRED'?'مطلوب استحقاق توليد':state==='PENDING'?'ننتظر التحقق من العملية':state==='FAILED'?'ما اكتملت العملية':'معاينة: تم التحقق من الدفع'}</h3><p>{state==='VERIFIED'?'هذه حالة واجهة تجريبية؛ لم يُحصّل مبلغ ولم يُمنح استحقاق فعلي.':state==='PENDING'?'في النسخة الفعلية ما نسمح بالتوليد حتى يؤكد الخادم المبلغ والعملة ومعرّف الطلب.':'تقدر تعيد المحاولة أو ترجع لمراجعة الزيارة.'}</p></div><div className="readiness-payment-states"><Button onClick={()=>setState('PENDING')}>جرّب حالة الانتظار</Button><Button variant="outline" onClick={()=>setState('FAILED')}>جرّب حالة الفشل</Button><Button variant="outline" onClick={()=>setState('VERIFIED')}>جرّب الحالة المؤكدة</Button></div><Button variant="outline" onClick={onBack}>ارجع لمعاينة الزيارة</Button></div></div>;
}
