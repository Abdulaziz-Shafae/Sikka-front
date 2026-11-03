import type {ApiPlanItem} from './backend-contract';
import type {Place} from './live-api';

// Testing point 08: show only server-confirmed prayer names and scheduled times.
// startsAt is the beginning of walking, not the actual prayer time.
const confirmedNames=new Set(['صلاة الفجر','صلاة الظهر','صلاة العصر','صلاة المغرب','صلاة العشاء']);
export function prayerPresentation(item:Pick<ApiPlanItem,'title'|'startsAt'|'walkingMinutes'|'placeId'|'breakType'>,places:Pick<Place,'id'|'name'|'kind'>[]){
 if(item.breakType!=='PRAYER')return null;
 const name=confirmedNames.has(item.title)?item.title:'وقت صلاة';
 const room=places.find(place=>place.id===item.placeId&&place.kind==='PRAYER_ROOM');
 let time:string|null=null;
 if(item.startsAt&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(item.startsAt)&&Number.isInteger(item.walkingMinutes)&&item.walkingMinutes>=0){
  const match=item.startsAt.match(/T(\d{2}):(\d{2})/);
  if(match){const minutes=(Number(match[1])*60+Number(match[2])+item.walkingMinutes)%1440;time=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');}
 }
 return {name,time,room:room?.name||null,confirmed:!!time};
}
export const provisionalPrayerMessage='مواقيت الصلاة وموقع المصلى في الخطة مبدئية إلى أن تؤكد وقت الوصول، وتتحقق سكة من مواقيت يوم الزيارة.';
