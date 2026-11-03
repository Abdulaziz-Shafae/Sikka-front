// Testing point 06: presentation-only copy; no additional AI calls or automatic retries.
export type GenerationState='PROCESSING'|'SUCCEEDED'|'FAILED';
export function generationFeedback(status:string,reason?:string){
 if(status==='PROCESSING')return 'سكة ترتّب خطتك الآن. تقدر تحدّث حالة الطلب من هنا بدون إرسال طلب توليد جديد.';
 if(status==='SUCCEEDED')return 'اكتمل توليد الخطة. افتح صفحة الخطة لمراجعتها واعتمادها.';
 if(status==='FAILED')return reason?.trim()? `تعذر توليد الخطة: ${reason.trim()} راجع المتطلبات قبل محاولة توليد جديدة.`:'تعذر توليد الخطة. راجع متطلبات الزيارة قبل محاولة توليد جديدة.';
 return 'تعذر تحديد حالة التوليد. حدّث الحالة قبل إرسال طلب جديد.';
}
export const rejectedPlanFeedback='رفضت هذه الخطة، وهي غير معتمدة. ارجع إلى مراجعة الزيارة لطلب إعادة توليد خطة جديدة إذا كانت الزيارة جاهزة.';
