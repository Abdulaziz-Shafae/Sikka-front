const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function load(name){const out={};const code=ts.transpileModule(fs.readFileSync(path.join(root,name),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require',code)(out,p=>p.endsWith('.json')?{default:JSON.parse(fs.readFileSync(path.resolve(root,'lib',p),'utf8'))}:require(p));return out;}
const {emptyFood,resizeFood,repeatDraft}=load('lib/food-flow.ts');
const {makeActivities,initialVisit}=load('lib/sikka-data.ts');
let food=resizeFood(emptyFood,1,2);assert.equal(food.breaks.length,3);food.breaks[0]={...food.breaks[0],timing:'START',restaurant:'اختيار مستقل',placeId:3};
assert.equal(resizeFood(food,1,1).breaks[0].placeId,3);
for(const type of ['SOLO','FRIENDS','FAMILY']){const visit={...initialVisit,type,duration:360,members:type==='SOLO'?['أنا']:['أنا','محمد','نواف'],food};const activities=makeActivities(visit);const breaks=activities.filter(a=>a.kind!=='RIDE');assert.equal(breaks.length,3);assert.equal(breaks.reduce((n,b)=>n+b.minutes,0),120);breaks.forEach(b=>assert.deepEqual(b.participants,visit.members));assert.equal(activities[0].title,'اختيار مستقل');const repeat=repeatDraft({...visit,paid:true,approved:true,completed:['iron-rattler'],ratings:{'iron-rattler':5}});assert.equal(repeat.date,'');assert.equal(repeat.paid,false);assert.deepEqual(repeat.completed,[]);assert.deepEqual(repeat.ratings,{});assert.deepEqual(repeat.food,food);}
assert.equal(makeActivities({...initialVisit,food:emptyFood}).filter(a=>a.kind!=='RIDE').length,0);
console.log('Passed food counts, independent restaurant retention, timing, shared food in Solo/Friends/Family, and repeat clearing payment/completions/ratings.');

for(const meals of [0,1])for(const snacks of [0,1,2])for(const type of ['SOLO','FRIENDS','FAMILY']){const food=resizeFood(emptyFood,meals,snacks);food.breaks.forEach((b,i)=>{b.placeId=i+10;b.restaurant=`Restaurant ${i}`;});const tasks=makeActivities({...initialVisit,type,food,duration:480});assert.equal(tasks.filter(t=>t.kind==='MEAL').length,meals);assert.equal(tasks.filter(t=>t.kind==='SNACK').length,snacks);assert.deepEqual(tasks.filter(t=>t.kind!=='RIDE').map(t=>t.title).sort(),food.breaks.map(b=>b.restaurant).sort());}
console.log('Passed all 18 food-count and trip-type combinations.');
