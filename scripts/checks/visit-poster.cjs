const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'lib/visit-poster.ts'),'utf8');
const out={};new Function('exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(out);
const rides=[{id:17,sourceRideId:'falcons-flight'},{id:22,sourceRideId:'adrena-line'}];
const data=[
 {id:2,rideId:17,rideName:'Falcons Flight',visitMemberId:8,status:'COMPLETED',completedAt:'2026-11-06T19:04:00'},
 {id:1,rideId:22,rideName:'Adrena-Line',visitMemberId:8,status:'COMPLETED',completedAt:'2026-11-06T18:45:00'},
 {id:3,rideId:17,rideName:'Falcons Flight',visitMemberId:8,status:'SKIPPED',completedAt:null},
 {id:4,rideId:22,rideName:'Adrena-Line',visitMemberId:12,status:'COMPLETED',completedAt:'2026-11-06T18:30:00'}
];
const selected=out.completedPosterRides(data,rides,8);
assert.equal(selected.length,2);
assert.equal(selected[0].name,'Adrena-Line');
assert.equal(selected[1].name,'Falcons Flight');
assert.equal(selected[1].recordLabel,'الأطول والأسرع والأعلى عالميًا');
assert.equal(selected[0].recordLabel,null);
assert.equal(selected[0].time,'18:45');
assert.equal(out.completedPosterRides(data,rides,12).length,1);
assert.deepEqual(out.posterPages(Array.from({length:18},(_,i)=>i)).map(p=>p.length),[8,8,2]);
assert.deepEqual(out.posterPages([],8),[]);
assert.throws(()=>out.posterPages([1],0));
const ui=fs.readFileSync(path.join(root,'components/sikka/visit-review.tsx'),'utf8');
const poster=fs.readFileSync(path.join(root,'components/sikka/visit-summary-poster.tsx'),'utf8');
const api=fs.readFileSync(path.join(root,'lib/backend-contract.ts'),'utf8');
assert.match(ui,/Promise\.all\(\[backendApi\.visitSummary\(visitId\),liveApi\.records\(visitId\),liveApi\.visit\(visitId\),liveApi\.rides\(\)\]\)/);
assert.match(ui,/completed\.length!==summary\.completedRidesCount/);
assert.match(api,/visit-summary\/\$\{positive\(id\)\}/);
assert.match(poster,/const positions=\[237,547,857,1167\]/);
assert.match(poster,/direction="right"/);
assert.match(poster,/direction="left"/);
assert.match(poster,/sikka-logo-final\.png/);
assert.doesNotMatch(poster,/achievement|إنجاز|meal|وجبة|snack|سناك/i);
console.log('Passed real-ride event filtering, source-based record highlights, fixed 4-column zigzag, pagination and backend wiring.');
