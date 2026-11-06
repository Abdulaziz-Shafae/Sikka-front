// Stable data contract for the approved Sikka visit-summary artwork.
// Ride events and their names/timestamps come from the authenticated backend; never demo data.
export type CompletedRideRecord={id:number;rideId?:number|null;rideName?:string|null;visitMemberId:number;status:string;completedAt?:string|null};
export type RideCatalogueEntry={id:number;sourceRideId:string};
export type PosterRide={id:number;name:string;time:string|null;recordLabel:string|null};
const officialRecords:Readonly<Record<string,string>>={
 'falcons-flight':'الأطول والأسرع والأعلى عالميًا',
 'iron-rattler':'أعلى Tilt Coaster عالميًا',
 'sirocco-tower':'أعلى Shot Tower قائم بذاته عالميًا',
 'spitfire':'أعلى Inverted Top Hat Coaster عالميًا',
 'gyrospin':'أعلى Pendulum Ride عالميًا'
};
function validTime(value:string|null){if(!value||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))return null;const hh=Number(value.slice(11,13)),mm=Number(value.slice(14,16));return hh<24&&mm<60?value.slice(11,16):null;}
export function completedPosterRides(records:CompletedRideRecord[],catalogue:RideCatalogueEntry[],memberId:number):PosterRide[]{
 const slugs=new Map(catalogue.map(r=>[r.id,r.sourceRideId]));
 return records.filter(r=>r.visitMemberId===memberId&&r.status==='COMPLETED'&&typeof r.rideId==='number'&&r.rideId>0&&!!r.rideName?.trim())
  .sort((a,b)=>(a.completedAt||'').localeCompare(b.completedAt||'')||a.id-b.id)
  .map(r=>({id:r.id,name:r.rideName!.trim(),time:validTime(r.completedAt||null),recordLabel:officialRecords[slugs.get(r.rideId!)||'']||null}));
}
export function posterPages<T>(items:T[],size=8):T[][]{if(!Number.isInteger(size)||size<=0)throw new Error('Invalid page size');const pages:T[][]=[];for(let i=0;i<items.length;i+=size)pages.push(items.slice(i,i+size));return pages;}
