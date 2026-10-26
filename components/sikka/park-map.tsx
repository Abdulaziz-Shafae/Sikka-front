'use client';
import { useEffect, useId, useMemo, useState } from 'react';
import { MousePointer2 as MousePointer2Icon, MapPin, LocateFixed, Route, Navigation, UtensilsCrossed, Maximize,  ArrowLeft, MoonStar, Toilet, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parkGraph, rides, findRoute } from '@/lib/sikka-data';
import {useParkMapView} from './use-park-map-view';
import {clusterMapMarkers} from '@/lib/park-map-geometry';
import {cuisines} from '@/lib/food-flow';
import {sikkaApi,type Restaurant} from '@/lib/sikka-api';
import { toast } from 'sonner';

type Layer = 'rides' | 'places' | 'prayer' | 'restrooms';
const areaNames: Record<string, string> = { 'city-of-thrills': 'مدينة التشويق', 'steam-town': 'ستيم تاون', 'twilight-gardens': 'حدائق الغسق', 'valley-of-fortune': 'وادي الكنوز', 'discovery-springs': 'ينابيع الاكتشاف', 'grand-exposition': 'المعرض الكبير', citadel: 'القلعة' };
function facilityName(place: typeof parkGraph.places[number]) {
  if (place.kind !== 'RESTROOM' && place.kind !== 'PRAYER_ROOM') return place.name;
  const area = Object.keys(areaNames).find(a => place.sourcePlaceId.startsWith(a));
  const number = place.sourcePlaceId.match(/\d+$/)?.[0] || '';
  return `${place.kind === 'PRAYER_ROOM' ? 'مصلى' : 'دورات مياه'} · ${area ? areaNames[area] : ''} ${number}`;
}
const mapItems = [
  ...parkGraph.rides.map(r => ({ id: r.sourceRideId, name: r.name.replace(' (temporarily closed)', ''), nodeId: r.nodeId, kind: 'RIDE' })),
  ...parkGraph.places.filter(p => ['RESTAURANT', 'PRAYER_ROOM', 'RESTROOM'].includes(p.kind)).map(p => ({ id: p.sourcePlaceId, name: facilityName(p), nodeId: p.nodeId, kind: p.kind })),
];
const mapPositions = mapItems.map(m=>{const n=parkGraph.nodes.find(n=>n.id===m.nodeId)!;return {...m,x:n.x,y:n.y};});
const mapFitPoints = mapPositions.map(({x,y})=>({x,y}));
const layerKinds: Record<Layer, string> = { rides: 'RIDE', places: 'RESTAURANT', prayer: 'PRAYER_ROOM', restrooms: 'RESTROOM' };
const layers = [{ id: 'rides' as Layer, name: 'الألعاب', icon: MapPin }, { id: 'places' as Layer, name: 'المطاعم', icon: UtensilsCrossed }, { id: 'prayer' as Layer, name: 'المصليات', icon: MoonStar }, { id: 'restrooms' as Layer, name: 'دورات المياه', icon: Toilet }];
export function ParkMap({ compact = false, onRide, itinerary=[],focusedKey,onActivity,serverRoutes=[],useServerRoutes=false }: { serverRoutes?:number[][][];useServerRoutes?:boolean;itinerary?:{key:string;activityKey?:string;title:string;completed:boolean;participants?:string[];start?:number;end?:number}[]; focusedKey?:string;onActivity?:(key:string)=>void;compact?: boolean; onRide: (s: string) => void; onPlan?: () => void }) {
  const [foodFilters,setFoodFilters]=useState<string[]>([]),[restaurants,setRestaurants]=useState<Restaurant[]>([]),[foodError,setFoodError]=useState('');

  const terrainId = useId().replace(/:/g, '');
  const [selected, setSelected] = useState('iron-rattler');
  const [layer, setLayer] = useState<Layer>('rides');
  useEffect(()=>{if(layer!=='places')return;let active=true;sikkaApi.restaurants().then(data=>{if(active){setRestaurants(data);setFoodError('');}}).catch(e=>{if(active)setFoodError(e.message);});return()=>{active=false;};},[layer]);
  const map = useParkMapView(mapFitPoints);
  const [expandedCluster,setExpandedCluster] = useState<string[]>([]);
  const [imageLoaded,setImageLoaded]=useState(false);
  const [routing, setRouting] = useState(false), [showPlanner, setShowPlanner] = useState(!compact), [imageError, setImageError] = useState(false);
  const [origin, setOrigin] = useState('iron-rattler'), [destination, setDestination] = useState('gearworks-eatery');

  const selectedItem = mapItems.find(m => m.id === selected)!;
  const selectedRide = rides.find(r => r.slug === selected);
  const route = useMemo(() => routing ? findRoute(origin, destination) : null, [routing, origin, destination]);
  const markers = mapPositions.filter(m => m.kind === layerKinds[layer]&&(layer!=='places'||!foodFilters.length||restaurants.some(p=>p.name.toLowerCase()===m.name.toLowerCase()&&p.cuisineTypes.some(c=>foodFilters.includes(c)))));
  const clusters = clusterMapMarkers(markers, map.view, map.size);
  const pointStyle = (n:{x:number;y:number}) => ({left:n.x*map.view.scale+map.view.x,top:n.y*map.view.scale+map.view.y});
  const startItem = mapItems.find(m => m.id === origin)!;
  const endItem = mapItems.find(m => m.id === destination)!;
  const startNode = parkGraph.nodes.find(n => n.id === startItem.nodeId)!;
  const endNode = parkGraph.nodes.find(n => n.id === endItem.nodeId)!;
  useEffect(()=>{if(!focusedKey)return;const item=mapPositions.find(m=>m.id===focusedKey);if(!item)return;setSelected(item.id);const next=layers.find(l=>layerKinds[l.id]===item.kind);if(next)setLayer(next.id);map.zoomToPoints([item]);setExpandedCluster([]);},[focusedKey]);
  const itineraryRoutes=useMemo(()=>{const previous=new Map<string,string>();const segments=new Map<string,ReturnType<typeof findRoute>>();for(const a of itinerary){if(!mapItems.some(m=>m.id===a.key))continue;for(const member of a.participants||['all']){const from=previous.get(member);if(from&&from!==a.key)segments.set(from+'>'+a.key,findRoute(from,a.key));previous.set(member,a.key);}}return [...segments.values()].filter(x=>x!==null);},[itinerary]);
  const selectedActivity=itinerary.find(a=>a.key===selected);
  const SelectedIcon = selectedItem.kind === 'PRAYER_ROOM' ? MoonStar : selectedItem.kind === 'RESTROOM' ? Toilet : selectedItem.kind === 'RESTAURANT' ? UtensilsCrossed : Navigation;
  function selectLayer(next: Layer) {
    setLayer(next);setExpandedCluster([]);map.fit();
    const first = mapItems.find(m => m.kind === layerKinds[next]);
    if (first) { setSelected(first.id); setDestination(first.id); }
    setRouting(false);
  }
  function drawRoute() {
    const found = findRoute(origin, destination);
    if (!found) { toast.info('ما لقينا مسار متصل بين النقطتين في بيانات المشروع.'); setRouting(false); return; }
    setRouting(true);map.fit();setExpandedCluster([]);
  }
  function locate() {
    if (!navigator.geolocation) { toast.error('جهازك ما يدعم تحديد الموقع'); return; }
    navigator.geolocation.getCurrentPosition(() => toast.info('تم تحديد موقعك. معايرة الموقع على صورة المنتزه تحتاج ربط الخدمة الفعلية؛ لم نضع موقعًا وهميًا.'), () => toast.info('ما قدرنا نحدد موقعك. تقدر تستكشف الخريطة يدويًا.'), { timeout: 10000 });
  }
  function destinationOptions() {
    return layers.map(l => <optgroup key={l.id} label={l.name}>{mapItems.filter(m => m.kind === layerKinds[l.id]).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>);
  }
  return <div className={`park-map ${compact ? 'compact-map' : ''}`}>
    <div className="map-toolbar"><div className="map-layers">{layers.map(l => <button key={l.id} aria-pressed={layer === l.id} className={layer === l.id ? 'active' : ''} onClick={() => selectLayer(l.id)}><l.icon size={15}/>{l.name}<small>{mapItems.filter(m => m.kind === layerKinds[l.id]).length}</small></button>)}</div><button className="map-plan-toggle" aria-expanded={showPlanner} onClick={() => setShowPlanner(s => !s)}><Footprints size={15}/>{showPlanner ? 'إخفاء مخطط المشي' : 'مسار مشي'}</button></div>
    {showPlanner && <div className="map-route-planner"><label><span>من وين نبدأ؟</span><select aria-label="بداية مسار المشي" value={origin} onChange={e => { setOrigin(e.target.value); setRouting(false); }}>{destinationOptions()}</select></label><Route size={19}/><label><span>وين نروح؟</span><select aria-label="وجهة مسار المشي" value={destination} onChange={e => { setDestination(e.target.value); setRouting(false); }}>{destinationOptions()}</select></label><Button disabled={origin === destination} onClick={drawRoute}>ارسم مسار المشي<Footprints size={16}/></Button></div>}
    {layer==='places'&&<div className="food-map-filters"><div className="filter-chips">{Object.entries(cuisines).map(([k,l])=><button key={k} aria-pressed={foodFilters.includes(k)} className={foodFilters.includes(k)?'active':''} onClick={()=>setFoodFilters(a=>a.includes(k)?a.filter(x=>x!==k):[...a,k])}>{l}</button>)}</div>{foodError&&<p role="status">{foodError} تصنيف المطاعم حسب النوع يحتاج بيانات الخدمة.</p>}</div>}
    {!!itinerary.length&&<ol className="map-itinerary">{itinerary.map((a,i)=><li key={a.activityKey||a.key} className={a.completed?'done':itinerary.find(x=>!x.completed)?.key===a.key?'next':''}><button onClick={()=>{const m=mapPositions.find(m=>m.id===a.key);if(m){setSelected(m.id);map.zoomToPoints([m]);}onActivity?.(a.activityKey||a.key);}}>{a.completed?'✓':i+1} · {a.title}</button></li>)}</ol>}
    <div className="map-gesture-guide"><MousePointer2Icon/>اسحب للتحريك، وقرّب بأصبعين أو بالتتش باد<span>بالكيبورد: + و − للتقريب · 0 للتوسيط</span></div>
    <div className="map-viewport" ref={map.viewportRef} tabIndex={0} role="group" aria-label="خريطة المنتزه التفاعلية. اسحب للتحريك، قرّب بأصبعين أو استخدم زائد وناقص من لوحة المفاتيح" {...map.handlers}>
      <div className="map-surface" style={{transform:`translate(${map.view.x}px,${map.view.y}px) scale(${map.view.scale})`,opacity:map.size.width?1:0}}>
        {(useServerRoutes?serverRoutes.length:itineraryRoutes.length)>0&&<svg className="readiness-plan-paths" width="6500" height="4035" aria-hidden="true">{(useServerRoutes?serverRoutes:itineraryRoutes.flatMap(r=>r!.paths)).map((path,i)=><polyline key={i} points={path.filter(p=>p.length===2&&p.every(Number.isFinite)).map(p=>p.join(',')).join(' ')} fill="none" stroke="#e84958" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>)}</svg>}
        {/* Tile only empty soil from the source image; rides and routes stay untouched. */}
        <svg className="map-terrain" width="6500" height="4035" aria-hidden="true">
          <defs>
            <svg id={`${terrainId}-soil`} width="600" height="600" viewBox="2000 1500 600 600" overflow="hidden">
              <image href="/api/media/map" width="6500" height="4035"/>
            </svg>
            <pattern id={`${terrainId}-terrain`} width="1200" height="1200" patternUnits="userSpaceOnUse">
              <g><use href={`#${terrainId}-soil`}/>
              <use href={`#${terrainId}-soil`} transform="translate(1200 0) scale(-1 1)"/>
              <use href={`#${terrainId}-soil`} transform="translate(0 1200) scale(1 -1)"/>
              <use href={`#${terrainId}-soil`} transform="translate(1200 1200) scale(-1 -1)"/></g>
            </pattern>
          </defs>
          <rect x="-50000" y="-50000" width="106500" height="104035" fill={`url(#${terrainId}-terrain)`}/>
        </svg>
        {!imageError && <img className="real-park-map" src="/api/media/map" alt="الخريطة المصوّرة للملاهي من مستودع سكة" onError={() => setImageError(true)} onLoad={()=>setImageLoaded(true)} draggable={false}/>}
        <svg preserveAspectRatio="none" viewBox="0 0 6500 4035" className={`map-routes ${!imageLoaded ? 'fallback-routes' : ''}`} aria-label="شبكة مسارات المشي من بيانات المشروع"><rect width="6500" height="4035" fill="transparent"/>{parkGraph.edges.map(e => <path key={e.id} d={'M' + e.points.map(p => p.join(',')).join('L')} fill="none" stroke={!imageLoaded ? '#8ac6e1' : '#0B2E8B'} strokeOpacity={!imageLoaded ? .65 : .22} strokeWidth={!imageLoaded ? 16 : 12} strokeLinecap="round"/>)}{route?.paths.map((p, i) => <path key={i} className="route-highlight" d={'M' + p.map(v => v.join(',')).join('L')} fill="none" stroke="#ed1d2d" strokeWidth="38" strokeLinecap="round"/>)}</svg>
      </div>
      <div className="map-markers" aria-label="مواقع المنتزه">{clusters.map(group=>{
        if(group.items.length>1)return <button key={group.items.map(m=>m.id).join('|')} className={`map-cluster ${group.items.some(m=>m.id===selected)?'contains-selected':''}`} style={{left:group.x,top:group.y}} aria-label={`${group.items.length} مواقع متقاربة: ${group.items.map(m=>m.name).join('، ')}`} onClick={()=>{setExpandedCluster(group.items.map(m=>m.id));map.zoomToPoints(group.items);}}><span>{group.items.length}</span><small>مواقع</small></button>;
        const m=group.items[0];const Icon=m.kind==='PRAYER_ROOM'?MoonStar:m.kind==='RESTROOM'?Toilet:m.kind==='RESTAURANT'?UtensilsCrossed:MapPin;
        return <button key={m.id} className={`map-pin ${m.id===selected?'selected':''} ${m.kind==='PRAYER_ROOM'?'prayer-pin':m.kind==='RESTROOM'?'restroom-pin':m.kind==='RESTAURANT'?'food-pin':''}`} style={{left:group.x,top:group.y}} title={m.name} aria-label={m.name} onClick={()=>{setSelected(m.id);setDestination(m.id);setRouting(false);setExpandedCluster([]);const activity=itinerary.find(a=>a.key===m.id);if(activity)onActivity?.(activity.activityKey||activity.key);}}>{itinerary.some(a=>a.key===m.id)?<span aria-label={itinerary.find(a=>a.key===m.id)?.completed?'مكتملة':'ترتيب النشاط'}>{itinerary.find(a=>a.key===m.id)?.completed?'✓':itinerary.findIndex(a=>a.key===m.id)+1}</span>:<Icon size={14}/>}<span>{m.name}</span></button>;
      })}</div>
      {route&&<div className="map-endpoints"><div className="route-endpoint route-start" style={pointStyle(startNode)}><span>بداية المشي</span></div><div className="route-endpoint route-end" style={pointStyle(endNode)}><span>الوجهة</span></div></div>}
      <div className="map-controls"><button aria-label="توسيط المنتزه وإعادة ضبط الخريطة" onClick={()=>{map.fit();setExpandedCluster([]);}}><Maximize size={18}/></button><button aria-label="تحديد موقعي" onClick={locate}><LocateFixed size={18}/></button></div>
      <div className="map-legend"><i/>مسارات المشروع <span>المداخل تحتاج تأكيدًا ميدانيًا</span></div>
    </div>
    {!!expandedCluster.length&&<div className="map-cluster-options"><div><strong>مواقع قريبة من بعض</strong><button onClick={()=>setExpandedCluster([])}>إغلاق</button></div><p>قرّبنا المنطقة. اختَر الموقع اللي تبيه:</p><div>{expandedCluster.map(id=>{const m=mapItems.find(m=>m.id===id)!;return <button key={id} onClick={()=>{setSelected(id);setDestination(id);setRouting(false);setExpandedCluster([]);}}><MapPin size={13}/>{m.name}</button>;})}</div></div>}
    {selectedItem.kind==='PRAYER_ROOM'&&<div className="prayer-access-note"><MoonStar size={16}/><div><strong>مصلى · التخصيص غير مؤكد</strong><span>الموقع متاح على الخريطة، لكن ما عندنا تأكيد إذا المداخل منفصلة للرجال والنساء.</span></div></div>}
    {route && <div className="walking-summary" role="status"><Footprints size={22}/><div><strong>{startItem.name} <ArrowLeft size={13}/> {endItem.name}</strong><span>المسار التقريبي: {route.meters} م · {route.minutes} د مشي · سرعة افتراضية ٧٠ م/د</span></div><button aria-label="إخفاء مسار المشي" onClick={() => setRouting(false)}>إخفاء</button></div>}
    <div className="map-selection">{selectedActivity&&<p className="readiness-map-state">{selectedActivity.completed?'مكتملة':'ضمن الجدول'}{selectedActivity.start!==undefined&&` · من الدقيقة ${selectedActivity.start} إلى ${selectedActivity.end}`}</p>}<span className="pin-square"><SelectedIcon size={22}/></span><div><small>{selectedRide?.landName || (selectedItem.kind === 'PRAYER_ROOM' ? 'مكان للصلاة' : selectedItem.kind === 'RESTROOM' ? 'دورات مياه' : 'بريك الأكل')}</small><h3 dir={selectedItem.kind === 'RIDE' || selectedItem.kind === 'RESTAURANT' ? 'ltr' : 'rtl'}>{selectedItem.name}</h3></div><div className="map-selection-actions"><Button variant="outline" onClick={() => { setDestination(selectedItem.id); setShowPlanner(true); setRouting(false); }}><Route size={15}/>امشِ لهنا</Button>{selectedRide && <Button onClick={() => onRide(selected)}>شوف اللعبة<ArrowLeft size={15}/></Button>}</div></div>
  </div>;
}
