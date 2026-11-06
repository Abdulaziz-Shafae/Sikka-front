'use client';
import {useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import type {PosterRide} from '@/lib/visit-poster';

const blue='#07358b',red='#ed1c2e',light='#d7ecff';
const recordLines:Record<string,string[]>={
 'الأطول والأسرع والأعلى عالميًا':['الأطول والأسرع والأعلى','عالميًا'],
 'أعلى Tilt Coaster عالميًا':['أعلى Tilt Coaster','عالميًا'],
 'أعلى Shot Tower قائم بذاته عالميًا':['أعلى Shot Tower','قائم بذاته عالميًا'],
 'أعلى Inverted Top Hat Coaster عالميًا':['أعلى Inverted Top Hat','Coaster عالميًا'],
 'أعلى Pendulum Ride عالميًا':['أعلى Pendulum Ride','عالميًا']
};
function nameLines(name:string):string[]{
 if(name.length<=19)return [name];
 const parts=name.split(' '),rows:string[]=[];let row='';
 for(const word of parts){if((row+' '+word).trim().length>19&&row){rows.push(row);row=word;}else row=(row+' '+word).trim();}
 if(row)rows.push(row);return rows.slice(0,2);
}
function Cart({x,y,direction}:{x:number;y:number;direction:'right'|'left'}){
 return <g transform={`translate(${x} ${y}) ${direction==='left'?'translate(105 0) scale(-1 1)':''}`}>
   <path d="M5 17 Q9 8 24 8 H81 Q95 8 100 23 L95 35 H10 Q1 34 5 17Z" fill={red}/>
   <path d="M13 11 L18 1 H27 L31 11 M58 11 L65 1 H74 L76 11" fill={blue} stroke={blue} strokeWidth="5" strokeLinejoin="round"/>
   <path d="M46 9 V34" stroke="#ffffff" strokeWidth="4"/>
   <circle cx="25" cy="37" r="11" fill={blue} stroke="#fff" strokeWidth="4"/><circle cx="80" cy="37" r="11" fill={blue} stroke="#fff" strokeWidth="4"/>
 </g>;
}
function RideCard({ride,x,y}:{ride:PosterRide;x:number;y:number}){
 const label=ride.recordLabel?recordLines[ride.recordLabel]:null;
 return <g>
  <rect x={x} y={y} width="274" height="154" rx="32" fill="#fff" stroke="#b9ddff" strokeWidth="2.5"/>
  <path d={`M${x+119} ${y+154} l18 17 l18 -17`} fill="#fff" stroke="#b9ddff" strokeWidth="2.5" strokeLinejoin="round"/>
  <path d={`M${x+120} ${y+153} h35`} stroke="#fff" strokeWidth="4"/>
  <text x={x+137} y={y+42} fontSize={ride.name.length>22?21:25} fontFamily="Arial,sans-serif" fill={blue} fontWeight="800" textAnchor="middle">
   {nameLines(ride.name).map((s,i)=><tspan x={x+137} dy={i===0?0:27} key={i}>{s}</tspan>)}
  </text>
  {label&&<g><rect x={x+16} y={y+82} width="242" height="58" rx="24" fill="#fff0f0"/>
   <text x={x+137} y={y+102} direction="rtl" fontFamily="Arial,sans-serif" fontSize="15" fontWeight="700" fill={blue} textAnchor="middle">🏆 رقم قياسي عالمي</text>
   {label.map((s,i)=><text x={x+137} y={y+122+i*15} direction="rtl" fontSize="14" fontWeight="700" fill={blue} textAnchor="middle" key={i}>{s}</text>)}
   </g>}
  {!label&&ride.time&&<text x={x+137} y={y+123} fontFamily="Arial,sans-serif" fontSize="21" fill={blue} textAnchor="middle" direction="ltr">{ride.time}</text>}
 </g>;
}
export function VisitSummaryPoster({rides,visitName,visitDate,pageIndex=0}:{rides:PosterRide[];visitName:string;visitDate:string;pageIndex?:number}){
 const svgRef=useRef<SVGSVGElement>(null),[saving,setSaving]=useState(false),[error,setError]=useState('');
 async function savePng(){
  const element=svgRef.current;if(!element)return;setSaving(true);setError('');
  let url:string|null=null;
  try{
   const cloned=element.cloneNode(true) as SVGSVGElement;
   cloned.setAttribute('xmlns','http://www.w3.org/2000/svg');cloned.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
   const logo=cloned.querySelector('image[data-sikka-logo]');
   if(logo){
    const result=await fetch('/brand/sikka-logo-final.png',{cache:'force-cache'});
    if(!result.ok)throw new Error('تعذر تحميل شعار سكة الأصلي.');
    const blob=await result.blob();
    const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('تعذر تجهيز الشعار'));reader.readAsDataURL(blob);});
    logo.setAttribute('href',data);
   }
   const xml=new XMLSerializer().serializeToString(cloned);
   url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}));
   const image=new Image();
   await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('تعذر تجهيز صورة الملخص'));image.src=url!;});
   const canvas=document.createElement('canvas');canvas.width=1600*2;canvas.height=900*2;
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('تعذر حفظ صورة الملخص');
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('تعذر إنشاء الصورة')),'image/png'));
   const downloadUrl=URL.createObjectURL(png);
   const anchor=document.createElement('a');anchor.href=downloadUrl;anchor.download=`sikka-visit-${visitDate}-${pageIndex+1}.png`;anchor.click();
   setTimeout(()=>URL.revokeObjectURL(downloadUrl),1000);
  }catch(e){setError(e instanceof Error?e.message:'تعذر حفظ الصورة');}finally{if(url)URL.revokeObjectURL(url);setSaving(false);}
 }
 // Approved artwork geometry is constant; only database-backed ride labels and counts change.
 const positions=[237,547,857,1167];
 return <section className="readiness-panel" aria-label="ملخص ألعاب الزيارة">
  <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label={`ملخص ${visitName}: ${rides.length} ألعاب مكتملة`} style={{width:'100%',height:'auto',display:'block',background:'#fff',borderRadius:16}}>
   <defs><linearGradient id="sikka-poster-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e9f5ff"/><stop offset=".43" stopColor="#fff"/><stop offset="1" stopColor="#fff"/></linearGradient></defs>
   <rect width="1600" height="900" fill="url(#sikka-poster-sky)"/>
   <path d="M0 225 Q90 80 160 175 T335 100 Q400 65 435 190" stroke="#b4dafa" opacity=".45" strokeWidth="7" fill="none"/>
   <path d="M1220 250 Q1340 80 1450 125 L1510 200 L1580 160" stroke="#cbe4fb" opacity=".6" strokeWidth="10" fill="none"/>
   <path d="M0 854 Q225 780 410 850 T880 842 T1600 842 V900 H0 Z" fill="#c7e7ff"/>
   <path d="M0 882 Q245 828 465 866 T925 870 T1600 852 V900 H0 Z" fill="#77bafa" opacity=".8"/>
   <image data-sikka-logo="true" href="/brand/sikka-logo-final.png" x="664" y="18" width="272" height="116" preserveAspectRatio="xMidYMid meet"/>
   <text x="800" y="186" fontSize="58" fontWeight="900" fill={blue} fontFamily="Arial,sans-serif" textAnchor="middle" direction="rtl">ملخص زيارتك</text>
   <rect x="480" y="207" width="300" height="60" rx="30" fill="#e2f0ff"/><rect x="795" y="207" width="330" height="60" rx="30" fill="#e2f0ff"/>
   <text x="630" y="248" fontSize="29" fontFamily="Arial,sans-serif" fontWeight="800" textAnchor="middle" fill={blue} direction="rtl">{rides.length} ألعاب</text>
   <text x="960" y="248" fontSize="26" fontFamily="Arial,sans-serif" fontWeight="800" textAnchor="middle" fill={blue}>Six Flags Qiddiya City</text>
   <path d="M132 510 H1430 Q1502 510 1502 580 V726 Q1502 785 1430 785 H145" stroke={blue} strokeWidth="19" strokeLinecap="round" fill="none"/>
   <path d="M132 510 H1430 Q1502 510 1502 580 V726 Q1502 785 1430 785 H145" stroke="#fff" strokeWidth="7" strokeDasharray="28 13" strokeLinecap="butt" fill="none"/>
   <rect x="54" y="445" width="169" height="52" rx="26" fill="#0756b2"/><text x="139" y="480" fontSize="24" fill="#fff" textAnchor="middle" fontWeight="700">بداية الزيارة</text>
   <rect x="53" y="700" width="169" height="52" rx="26" fill="#0756b2"/><text x="139" y="735" fontSize="24" fill="#fff" textAnchor="middle" fontWeight="700">نهاية الزيارة</text>
   <path d="M160 691 v-52" stroke={blue} strokeWidth="7"/><path d="M160 639 l58 16 -58 17z" fill={blue}/>
   {positions.map((x,i)=>rides[i]?<g key={i}><RideCard x={x} y={292} ride={rides[i]}/><Cart x={x+85} y={472} direction="right"/><circle cx={x+137} cy={515} r="15" stroke="#0958b5" strokeWidth="6" fill="#fff"/></g>:null)}
   {positions.map((x,i)=>rides[i+4]?<g key={i}><RideCard x={x} y={571} ride={rides[i+4]}/><Cart x={x+85} y={747} direction="left"/><circle cx={x+137} cy={785} r="15" stroke="#0958b5" strokeWidth="6" fill="#fff"/></g>:null)}
   <text x="800" y="877" textAnchor="middle" fontSize="17" fill={blue} opacity=".7" fontFamily="Arial,sans-serif">{visitDate} · {visitName.slice(0,50)}</text>
  </svg>
  <div className="readiness-actions"><Button type="button" disabled={saving} onClick={()=>void savePng()}>{saving?'نجهز الصورة…':'احفظ ملخص سكتك كصورة'}</Button></div>
  {error&&<p role="alert">{error}</p>}
 </section>;
}
