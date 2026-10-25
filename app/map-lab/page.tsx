'use client';
import { useMemo, useState } from 'react';
import { ArrowLeft, Compass, LocateFixed, MapPin, Pause, Play } from 'lucide-react';
import { parkGraph } from '@/lib/sikka-data';
import { useParkMapView } from '@/components/sikka/use-park-map-view';
import './map-lab.css';

const nodes = new Map(parkGraph.nodes.map(n => [n.id, n]));
const attractions = parkGraph.rides.map((ride, index) => {
  const node = nodes.get(ride.nodeId);
  return { id: ride.sourceRideId, name: ride.name.replace(' (temporarily closed)', ''), x: node?.x ?? 0, y: node?.y ?? 0, animation: index % 3 === 0 ? 'coaster' : index % 3 === 1 ? 'wheel' : 'swing' };
}).filter(ride => ride.x > 0 && ride.y > 0);
const fitPoints = attractions.map(({ x, y }) => ({ x, y }));

function AnimatedIcon({ animation }: { animation: string }) {
  if (animation === 'wheel') return <svg viewBox="0 0 80 80" aria-hidden="true"><g className="lab-wheel"><circle cx="40" cy="37" r="26"/><path d="M40 11V63M14 37H66M22 19L58 55M58 19L22 55"/><circle cx="40" cy="37" r="5"/></g><path d="M25 76L40 38L55 76"/></svg>;
  if (animation === 'swing') return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M14 76L40 8L66 76"/><g className="lab-swing"><path d="M40 8V58"/><path d="M17 57H63" strokeWidth="8"/></g></svg>;
  return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M5 57Q20 7 40 39T75 19" fill="none" strokeDasharray="4 5"/><g className="lab-train"><rect x="0" y="0" width="23" height="12" rx="5"/><circle cx="5" cy="14" r="3"/><circle cx="18" cy="14" r="3"/></g></svg>;
}

export default function AnimatedMapLab() {
  const map = useParkMapView(fitPoints);
  const [selected, setSelected] = useState(attractions[0]?.id ?? '');
  const [playing, setPlaying] = useState(true);
  const active = useMemo(() => attractions.find(r => r.id === selected), [selected]);
  function focusRide(ride: typeof attractions[number]) { setSelected(ride.id); map.zoomToPoints([ride]); }
  return <main className="lab-page" dir="rtl">
    <header className="lab-header">
      <div><a href="/#map" className="lab-back"><ArrowLeft size={16}/> الخريطة الحالية</a><span className="lab-tag">Sikka / تجربة مستقلة</span><h1>الخريطة المتحركة</h1><p>اسحب الخريطة، قرّب بأصبعين، واضغط على أي لعبة لتنتقل الكاميرا إليها.</p></div>
      <div className="lab-actions"><button onClick={() => setPlaying(v => !v)}>{playing ? <Pause size={16}/> : <Play size={16}/>} {playing ? 'إيقاف الحركة' : 'تشغيل الحركة'}</button><button onClick={() => map.fit()}><LocateFixed size={16}/> عرض المنتزه</button></div>
    </header>
    <div className="lab-layout">
      <section className={`lab-map ${playing ? '' : 'lab-paused'}`} ref={map.viewportRef} tabIndex={0} role="group" aria-label="تجربة خريطة سكة المتحركة" {...map.handlers}>
        <div className="lab-world" style={{transform: `translate(${map.view.x}px, ${map.view.y}px) scale(${map.view.scale})`}}>
          <img src="/api/media/map" alt="خريطة ملاهي Six Flags القدية" width="6500" height="4035" draggable={false}/>
          {attractions.map(ride => <button key={ride.id} className={`lab-ride ${ride.id === selected ? 'is-active' : ''}`} style={{left: ride.x, top: ride.y}} onClick={() => focusRide(ride)} aria-label={`انتقل إلى ${ride.name}`}><AnimatedIcon animation={ride.animation}/><span>{ride.name}</span></button>)}
        </div>
        <div className="lab-hint"><Compass size={16}/> اسحب الخريطة أو اختر لعبة من القائمة</div>
      </section>
      <aside className="lab-side">
        <p className="lab-kicker">جرّب الانتقالات</p><h2>{active?.name ?? 'الألعاب'}</h2><p>الحركات هنا تجريبية وتعبر عن أنواع ألعاب، وليست محاكاة دقيقة لحركة الألعاب الحقيقية.</p>
        <div className="lab-list">{attractions.map(ride => <button key={ride.id} className={ride.id === selected ? 'selected' : ''} onClick={() => focusRide(ride)}><MapPin size={15}/><span>{ride.name}</span><ArrowLeft size={13}/></button>)}</div>
      </aside>
    </div>
    <footer className="lab-footer">معاينة تصميمية فقط · مواقع الألعاب مأخوذة من بيانات سكة · لا توجد تعديلات على الخطط أو قاعدة البيانات</footer>
  </main>;
}
