'use client';
import { useMemo,useState,useRef } from 'react';
import { MapPin,Plus,Minus,LocateFixed,Route,Navigation,UtensilsCrossed,Maximize,MousePointer2,ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parkGraph,rides,findRoute } from '@/lib/sikka-data';
import { toast } from 'sonner';
export function ParkMap({compact=false,onRide,onPlan}:{compact?:boolean;onRide:(s:string)=>void;onPlan?:()=>void}){
const [selected,setSelected]=useState('iron-rattler'),[layer,setLayer]=useState('rides'),[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0}),[routing,setRouting]=useState(false),[imageError,setImageError]=useState(false);const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
const ride=rides.find(r=>r.slug===selected)!;const route=useMemo(()=>routing?findRoute(selected,'gearworks-eatery'):null,[routing,selected]);
const markers=layer==='places'?parkGraph.places.filter(p=>p.kind==='RESTAURANT'):parkGraph.rides;
function locate(){if(!navigator.geolocation){toast.error('جهازك ما يدعم تحديد الموقع');return;}navigator.geolocation.getCurrentPosition(()=>toast.info('تم تحديد موقعك. معايرة الموقع على صورة المنتزه تحتاج ربط الخدمة الفعلية؛ لم نضع موقعًا وهميًا.'),()=>toast.info('ما قدرنا نحدد موقعك. تقدر تستكشف الخريطة يدويًا.'),{timeout:10000});}
return <div className={`park-map ${compact?'compact-map':''}`}>
<div className="map-toolbar"><div className="map-layers"><button className={layer==='rides'?'active':''} onClick={()=>setLayer('rides')}><MapPin size={15}/>الألعاب</button><button className={layer==='places'?'active':''} onClick={()=>setLayer('places')}><UtensilsCrossed size={15}/>المطاعم</button></div><span className="map-tip"><MousePointer2 size={14}/>اسحب لاستكشاف المنتزه</span></div>
<div className="map-viewport" onPointerDown={e=>{if((e.target as Element).closest('button'))return;drag.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current)setPan({x:drag.current.px+e.clientX-drag.current.x,y:drag.current.py+e.clientY-drag.current.y});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
<div className="map-surface" style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
{!imageError&&<img className="real-park-map" src="/api/media/map" alt="الخريطة المصوّرة للملاهي من مستودع سكة" onError={()=>setImageError(true)} draggable={false}/>}
<svg preserveAspectRatio="none" viewBox="0 0 6500 4035" className={`map-routes ${imageError?'fallback-routes':''}`} aria-label="شبكة مسارات المشي من بيانات المشروع"><rect width="6500" height="4035" fill={imageError?'#e3eed9':'transparent'}/>{parkGraph.edges.map(e=><path key={e.id} d={'M'+e.points.map(p=>p.join(',')).join('L')} fill="none" stroke={imageError?'#fff':'#0B2E8B'} strokeOpacity={imageError?1:.22} strokeWidth={imageError?28:12} strokeLinecap="round"/>)}{route?.paths.map((p,i)=><path key={i} className="route-highlight" d={'M'+p.map(v=>v.join(',')).join('L')} fill="none" stroke="#ed1d2d" strokeWidth="38" strokeLinecap="round"/>)}</svg>
{markers.map(m=>{const n=parkGraph.nodes.find(n=>n.id===m.nodeId);if(!n)return null;const slug='sourceRideId'in m?m.sourceRideId:'';return <button key={m.name} className={`map-pin ${slug===selected?'selected':''} ${layer==='places'?'food-pin':''}`} style={{left:`${n.x/6500*100}%`,top:`${n.y/4035*100}%`}} title={m.name} aria-label={m.name} onClick={()=>{if(slug){setSelected(slug);setRouting(false);}else toast.info(m.name);}}>{layer==='places'?<UtensilsCrossed size={13}/>:<MapPin size={14}/>}<span>{m.name}</span></button>;})}
</div>
<div className="map-controls"><button aria-label="تكبير الخريطة" onClick={()=>setZoom(z=>Math.min(3,z+.25))}><Plus size={19}/></button><button aria-label="تصغير الخريطة" onClick={()=>setZoom(z=>Math.max(.75,z-.25))}><Minus size={19}/></button><button aria-label="إعادة ضبط الخريطة" onClick={()=>{setZoom(1);setPan({x:0,y:0});}}><Maximize size={17}/></button><button aria-label="تحديد موقعي" onClick={locate}><LocateFixed size={18}/></button></div>
<div className="map-legend"><i/>مسارات المشروع <span>مداخل الألعاب غير مؤكدة</span></div>
</div>
<div className="map-selection"><span className="pin-square"><Navigation size={22}/></span><div><small>{routing?'وجهتك: Gearworks Eatery':ride.landName}</small><h3 dir="ltr">{ride.name}</h3>{route&&<small>المسار التقريبي: {route.meters} م · {route.minutes} د مشي</small>}</div><div className="map-selection-actions"><Button variant="outline" onClick={()=>setRouting(r=>!r)}><Route size={15}/>{routing?'إخفاء المسار':'مسار للبريك'}</Button><Button onClick={()=>onRide(selected)}>شوف اللعبة<ArrowLeft size={15}/></Button></div></div>
</div>;
}
