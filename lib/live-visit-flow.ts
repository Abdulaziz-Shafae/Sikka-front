export function firstVisitStep(tripType:string){return tripType==='SOLO'?'preferences':'members';}
export function visitEntryStep(visit:{tripType:string;status:string}){return ['READY','IN_PROGRESS','COMPLETED'].includes(visit.status)?'plan':firstVisitStep(visit.tripType);}
export function canRepeatVisit(status:string){return status==='COMPLETED';}
export function hoursToMinutes(hours:number){const minutes=Math.round(hours*60);if(!Number.isFinite(hours)||minutes<1||minutes>1440)throw new Error('حدد مدة الزيارة بين نصف ساعة و24 ساعة');return minutes;}
export function visitHours(minutes:number){return Number((minutes/60).toFixed(2));}
