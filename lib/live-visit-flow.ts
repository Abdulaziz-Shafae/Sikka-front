export function firstVisitStep(tripType:string){return tripType==='SOLO'?'preferences':'members';}
export function visitEntryStep(visit:{tripType:string;status:string}){return ['READY','IN_PROGRESS','COMPLETED'].includes(visit.status)?'plan':firstVisitStep(visit.tripType);}
export function canRepeatVisit(status:string){return status==='COMPLETED';}
export function hoursToMinutes(hours:number){const minutes=Math.round(hours*60);if(!Number.isFinite(hours)||minutes<1||minutes>1440)throw new Error('حدد مدة الزيارة بين نصف ساعة و24 ساعة');return minutes;}
export function visitHours(minutes:number){return Number((minutes/60).toFixed(2));}

export function rideAvailabilityLabel(ride:{status:string;availabilitySource?:string|null;waitObservedAt?:string|null}){
 if(ride.availabilitySource==='SIKKA_DEFAULT_AVAILABILITY')return 'متاحة للاختيار — التشغيل غير مؤكد';
 if(ride.availabilitySource==='QUEUE_ANALYTICS_LIVE'){const raw=ride.waitObservedAt||'';const observed=Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(raw)?raw:raw+'+03:00');if(!Number.isFinite(observed)||Date.now()-observed>600000||observed>Date.now()+30000)return 'متاحة للاختيار — حالة التشغيل قديمة';}
 return ride.status==='OPEN'?'مفتوحة':ride.status==='CLOSED'?'مغلقة':ride.availabilitySource==='ADMIN'?'غير متاحة':'متاحة للاختيار — التشغيل غير مؤكد';
}

export function hasPlanningProfile(profile:{birthDate:string|null;heightCm:number|null;weightKg:number|null;thrillPreference:string|null}|null){return !!profile?.birthDate&&Number(profile.heightCm)>0&&Number(profile.weightKg)>0&&!!profile.thrillPreference;}
export function extractInviteCode(message:string){return message.match(/invite code:\s*([A-Za-z0-9]+)/i)?.[1]||'';}

export function formatPlanOffset(minutes:number){return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;}

export function visitCategory(visit:{status:string;visitDate:string},today:string){return visit.status==='IN_PROGRESS'&&visit.visitDate===today?'current':visit.visitDate<today||['COMPLETED','CANCELLED'].includes(visit.status)?'past':'upcoming';}
export function parkHoursUnrestricted(){return process.env.NEXT_PUBLIC_SIKKA_PARK_UNRESTRICTED_HOURS==='true';}
export function parkOpening(date:string){if(parkHoursUnrestricted())return '00:00';const day=new Date(date+'T12:00:00+03:00').getUTCDay();return day===1||day===2?null:day===6?'12:00':'16:00';}
