const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function load(name){const source=fs.readFileSync(path.join(root,name),'utf8');const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;const out={};new Function('exports',code)(out);return out;}
const {getMapBounds,fitMapView,zoomMapAt,constrainMapView,clusterMapMarkers}=load('lib/park-map-geometry.ts');
const {getVisitSteps,getNextPageAfterVisitDetails}=load('lib/visit-flow.ts');
const graph=JSON.parse(fs.readFileSync(path.join(root,'lib/park-routes.json'),'utf8'));
const locations=[...graph.rides,...graph.places].map(p=>graph.nodes.find(n=>n.id===p.nodeId));
const bounds=getMapBounds(locations);
for(const size of [{width:390,height:480},{width:1220,height:590},{width:500,height:300}]){
 const fit=fitMapView(locations,size);
 assert.ok(Math.abs((bounds.minX+bounds.maxX)/2*fit.scale+fit.x-size.width/2)<.001,'Park centered horizontally');
 assert.ok(Math.abs((bounds.minY+bounds.maxY)/2*fit.scale+fit.y-size.height/2)<.001,'Park centered vertically');
 for(const p of locations){assert.ok(p.x*fit.scale+fit.x>=45&&p.x*fit.scale+fit.x<=size.width-45);assert.ok(p.y*fit.scale+fit.y>=45&&p.y*fit.scale+fit.y<=size.height-45);}
 const anchor={x:size.width*.7,y:size.height*.4};
 const zoom=zoomMapAt(fit,2,anchor,fit.scale*.65,fit.scale*12);
 assert.ok(Math.abs((anchor.x-fit.x)/fit.scale-(anchor.x-zoom.x)/zoom.scale)<.001,'Pinch anchor preserved');
 assert.ok(Math.abs((anchor.y-fit.y)/fit.scale-(anchor.y-zoom.y)/zoom.scale)<.001);
 assert.equal(zoomMapAt(fit,100,anchor,fit.scale,fit.scale*12).scale,fit.scale*12);
 const constrained=constrainMapView({...zoom,x:1e8,y:-1e8},size,bounds);
 assert.ok(constrained.x+bounds.minX*constrained.scale<size.width&&constrained.y+bounds.maxY*constrained.scale>0,'Cannot lose the park');
}
const points=[{id:'one',x:100,y:100},{id:'two',x:105,y:104},{id:'three',x:300,y:200}];
assert.equal(clusterMapMarkers(points,{x:0,y:0,scale:1},{width:500,height:400}).length,2);
assert.equal(clusterMapMarkers(points,{x:-900,y:-900,scale:10},{width:3000,height:3000}).length,3,'Close sites separate when zooming');
assert.equal(clusterMapMarkers([{id:'one',x:100,y:100},{id:'two',x:100,y:100}],{x:0,y:0,scale:10},{width:2000,height:2000})[0].items.length,2,'Coincident sites remain individually selectable');
assert.ok(!getVisitSteps('SOLO').some(s=>s.page==='members'));
assert.equal(getNextPageAfterVisitDetails('SOLO'),'selection');
for(const type of ['FRIENDS','FAMILY']){assert.ok(getVisitSteps(type).some(s=>s.page==='members'));assert.equal(getNextPageAfterVisitDetails(type),'members');}
console.log('Passed park centering at 3 viewport sizes, zoom anchors and limits, marker clustering, and Solo/Friends/Family routes.');
