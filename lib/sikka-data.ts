import catalogue from './park-catalogue.json';
import graph from './park-routes.json';
export const lands: Record<string,string> = {CITY_OF_THRILLS:'مدينة التشويق',STEAM_TOWN:'ستيم تاون',GRAND_EXPOSITION:'المعرض الكبير',TWILIGHT_GARDENS:'حدائق الغسق',DISCOVERY_SPRINGS:'ينابيع الاكتشاف',VALLEY_OF_FORTUNE:'وادي الكنوز',CITADEL:'القلعة'};
export const photos:Record<string,{url:string;credit:string;source:string}> = {
falcon:{url:'https://www.intamin.com/wp-content/uploads/2026/02/IAR_SoMe_Falcons100Procent_20263.jpg',credit:'Intamin',source:'https://www.intamin.com/project/falcons-flight/'},
iron:{url:'https://rcdb.com/aaiulga',credit:'RCDB',source:'https://rcdb.com/21312.htm'},
sirocco:{url:'https://pbs.twimg.com/media/HBi1IIEbUAI-o6F.jpg',credit:'Attractions 360°',source:'https://x.com/SoCal360/status/2024567187709861984'},
park:{url:'https://blooloop.com/media-library/falcons-flight-at-six-flags-qiddiya-city.jpg?id=63059559&width=1600',credit:'Intamin / blooloop',source:'https://blooloop.com/intamin-six-flags-qiddiya-city/'},
map:{url:'https://raw.githubusercontent.com/Abdulaziz-Shafae/SIKKA/7fca9f36274eaaa32011ce82645bbc53aa78df33/src/main/resources/static/maps/park-map.jpg',credit:'خريطة المشروع',source:'https://github.com/Abdulaziz-Shafae/SIKKA'}
};
const descriptions:Record<string,string>={'falcons-flight':'حلّق فوق هضاب طويق، وخذ جرعتك من الحماس.','iron-rattler':'منعطفات ومغامرة وسط عالم ستيم تاون.','sirocco-tower':'إطلالة من فوق… ولحظة ما تنساها.'};
export const rides=catalogue.map((r,i)=>({...r,id:i+1,slug:r.sourceRideId,landName:lands[r.land]||r.land,description:descriptions[r.sourceRideId]||'تجربة جديدة تضيفها لذكريات يومك في الملاهي.',photo:r.sourceRideId==='falcons-flight'?'falcon':r.sourceRideId==='iron-rattler'?'iron':r.sourceRideId==='sirocco-tower'?'sirocco':null}));
export type Ride=typeof rides[number];
export const featured=['falcons-flight','iron-rattler','sirocco-tower'].map(id=>rides.find(r=>r.slug===id)!);
export const parkGraph=graph;
export const categoryName:Record<string,string>={THRILL:'حماس عالي',FAMILY:'مع العائلة',KIDS:'للصغار',ARCADE:'ألعاب كرنفال',WATER:'مغامرة مائية'};
export const meals=[{name:'Gearworks Eatery',land:'ستيم تاون',type:'مطعم',style:'meal-orange'},{name:"Primo’s Pizzeria",land:'مدينة التشويق',type:'بيتزا',style:'meal-red'},{name:'Coffee & Treats',land:'ينابيع الاكتشاف',type:'قهوة وسناك',style:'meal-blue'}];
export const initialVisit={id:'demo',name:'طلعة الشباب',type:'FRIENDS',date:'2026-10-31',duration:240,arrival:'16:00',together:'SPLIT',goal:'ألعاب أكثر',prayer:true,meal:'وجبة وسناك',restaurant:'Gearworks Eatery',members:['عبدالعزيز','محمد','نواف'],selected:['iron-rattler','sirocco-tower'],status:'DRAFT',paid:false,approved:false,completed:[] as string[],ratings:{} as Record<string,number>};
export type Visit=typeof initialVisit;
export function makeActivities(v:Visit){
  const selected=v.selected.length?v.selected:['iron-rattler','sirocco-tower'];
  const hasMeal=v.meal==='وجبة'||v.meal==='وجبة وسناك';
  const hasSnack=v.meal==='سناك'||v.meal==='وجبة وسناك';
  const reserved=(hasMeal?60:0)+(hasSnack?30:0);
  const capacity=Math.max(0,Math.floor((v.duration-reserved)/45));
  const chosen=selected.slice(0,capacity);
  const tasks:{key:string;title:string;kind:string;minutes:number;offset:number;participants:string[]}[]=[];
  let offset=0;
  function add(key:string,title:string,kind:string,minutes:number,participants=v.members){tasks.push({key,title,kind,minutes,offset,participants});offset+=minutes;}
  const splitAt=Math.ceil(chosen.length/2);
  chosen.forEach((slug,i)=>{
    if(i===splitAt&&hasMeal)add('meal',v.restaurant,'MEAL',60);
    add(slug,rides.find(r=>r.slug===slug)?.name||slug,'RIDE',35,v.together==='TOGETHER'||v.members.length<2?v.members:i%2===0?v.members.slice(0,Math.ceil(v.members.length/2)):v.members.slice(Math.ceil(v.members.length/2)));
    offset+=10;
  });
  if(hasMeal&&!tasks.some(t=>t.key==='meal'))add('meal',v.restaurant,'MEAL',60);
  if(hasSnack)add('snack','وقت السناك','SNACK',30);
  return tasks;
}
export function timeLabel(offset:number,v:Visit){if(!v.arrival)return `بعد البداية بـ ${offset} د`;const [h,m]=v.arrival.split(':').map(Number);return new Intl.DateTimeFormat('ar-SA',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).format(new Date(Date.UTC(2026,9,31,h,m+offset)));}
export function findRoute(from:string,to:string){const start=graph.rides.find(r=>r.sourceRideId===from)?.nodeId;const end=graph.places.find(r=>r.sourcePlaceId===to)?.nodeId??graph.rides.find(r=>r.sourceRideId===to)?.nodeId;if(start==null||end==null)return null;const dist=new Map<number,number>([[start,0]]),prev=new Map<number,{node:number;edge:typeof graph.edges[number]}>(),done=new Set<number>();while(true){let u:number|undefined,best=Infinity;for(const [n,d]of dist)if(!done.has(n)&&d<best){best=d;u=n;}if(u===undefined)break;if(u===end)break;done.add(u);for(const e of graph.edges){const next=e.fromNode===u?e.toNode:e.toNode===u?e.fromNode:null;if(next===null)continue;const d=best+e.distanceMeters;if(d<(dist.get(next)??Infinity)){dist.set(next,d);prev.set(next,{node:u,edge:e});}}}if(!dist.has(end))return null;const paths=[];let n=end;while(n!==start){const p=prev.get(n);if(!p)return null;paths.unshift(p.edge.points);n=p.node;}return {meters:Math.round(dist.get(end)!),minutes:Math.max(1,Math.ceil(dist.get(end)!/70)),paths};}
