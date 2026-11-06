import graph from './park-routes.json';

// Point 09: match real GPS to a georeferenced walking-edge segment only.
// No global image transform: the image is not accurately represented by one affine projection.
type Point=[number,number];
type Node=(typeof graph.nodes)[number];
type Edge=(typeof graph.edges)[number];
export type SnappedLocation={point:Point;edgeId:number;fraction:number;distanceMeters:number;accuracyMeters:number};
const nodes=new Map<number,Node>(graph.nodes.map(n=>[n.id,n]));
const rad=Math.PI/180;
const originLat=24.5886;
const meterX=111320*Math.cos(originLat*rad);
const meterY=111320;
function local(lon:number,lat:number):Point{return [lon*meterX,lat*meterY];}
function segmentProjection(p:Point,a:Point,b:Point){const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy;const t=d?Math.min(1,Math.max(0,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d)):0;return {t,distance:Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t)};}
function splitPolyline(edge:Edge,fraction:number){const points=edge.points as Point[];const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));const target=lengths.reduce((a,b)=>a+b,0)*fraction;let used=0;for(let i=0;i<lengths.length;i++){if(used+lengths[i]>=target){const t=lengths[i]?(target-used)/lengths[i]:0;const mid:Point=[points[i][0]+t*(points[i+1][0]-points[i][0]),points[i][1]+t*(points[i+1][1]-points[i][1])];return {point:mid,toStart:[mid,...points.slice(0,i+1).reverse()] as Point[],toEnd:[mid,...points.slice(i+1)] as Point[]};}used+=lengths[i];}return {point:points.at(-1)!,toStart:[...points].reverse(),toEnd:[points.at(-1)!]};}
export function snapGpsToPath(latitude:number,longitude:number,accuracy:number):SnappedLocation|null{
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(accuracy)||accuracy<0||accuracy>15)return null;
 const p=local(longitude,latitude);
 let best:{edge:Edge;fraction:number;distance:number}|null=null;
 for(const e of graph.edges){const a=nodes.get(e.fromNode),b=nodes.get(e.toNode);if(!a||!b)continue;const q=segmentProjection(p,local(a.longitude,a.latitude),local(b.longitude,b.latitude));if(!best||q.distance<best.distance)best={edge:e,fraction:q.t,distance:q.distance};}
 // Reject fixes outside known walking paths; do not place an unverified blue dot.
 if(!best||best.distance>12)return null;
 return {point:splitPolyline(best.edge,best.fraction).point,edgeId:best.edge.id,fraction:best.fraction,distanceMeters:best.distance,accuracyMeters:accuracy};
}
export function routeFromGpsToRide(fix:SnappedLocation,rideKey:string){
 const ride=graph.rides.find(r=>r.sourceRideId===rideKey);const startEdge=graph.edges.find(e=>e.id===fix.edgeId);if(!ride||!startEdge)return null;
 const goal=ride.nodeId;
 const distances=new Map<number,number>([[goal,0]]);
 const next=new Map<number,{node:number;edge:Edge}>();
 const done=new Set<number>();
 while(true){let current:number|undefined,lowest=Infinity;for(const [id,d] of distances)if(!done.has(id)&&d<lowest){current=id;lowest=d;}if(current===undefined)break;done.add(current);for(const edge of graph.edges){const other=edge.fromNode===current?edge.toNode:edge.toNode===current?edge.fromNode:null;if(other===null)continue;const distance=lowest+edge.distanceMeters;if(distance<(distances.get(other)??Infinity)){distances.set(other,distance);next.set(other,{node:current,edge});}}}
 const parts=splitPolyline(startEdge,fix.fraction);
 const starts=[{node:startEdge.fromNode,dist:startEdge.distanceMeters*fix.fraction,points:parts.toStart},{node:startEdge.toNode,dist:startEdge.distanceMeters*(1-fix.fraction),points:parts.toEnd}];
 const viable=starts.filter(s=>distances.has(s.node)).sort((a,b)=>(a.dist+distances.get(a.node)!)-(b.dist+distances.get(b.node)!));if(!viable.length)return null;
 const selected=viable[0],paths:Point[][]=[selected.points],visited=new Set<number>();let node=selected.node;
 while(node!==goal){if(visited.has(node))return null;visited.add(node);const hop=next.get(node);if(!hop)return null;const points=hop.edge.fromNode===node?hop.edge.points as Point[]:[...hop.edge.points].reverse() as Point[];paths.push(points);node=hop.node;}
 const meters=Math.round(selected.dist+distances.get(selected.node)!);
 return {paths,meters,minutes:Math.max(1,Math.ceil(meters/70)),estimated:true};
}
