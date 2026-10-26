const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),cache={};
function load(name){if(cache[name])return cache[name];const out={};cache[name]=out;const code=ts.transpileModule(fs.readFileSync(path.join(root,name+'.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require','process',code)(out,p=>p.startsWith('.')?load(path.posix.join(path.posix.dirname(name),p)):require(p),process);return out;}
(async()=>{
 process.env.NEXT_PUBLIC_SIKKA_API_URL='/api/backend';
 const client=load('lib/api-client'),payments=load('lib/payment-api');const requests=[];let response={id:2,name:'QA',email:'qa@example.test',role:'USER',emailVerified:true},status=200;
 global.fetch=async(url,options)=>{requests.push({url,options});return new Response(JSON.stringify(response),{status,headers:{'Content-Type':'application/json'}});};
 await client.authenticate('qa@example.test','not-persisted');assert.equal(client.hasAuthentication(),true);assert.match(requests[0].options.headers.Authorization,/^Basic /);
 response={id:17,status:'PENDING',amountSar:'29.00',verifiedAt:null};const order=await payments.paymentApi.create(9);assert.equal(order.amountSar,29);assert.equal(requests.at(-1).url,'/api/backend/api/v1/payment-order/add/9');
 const config=payments.checkoutConfiguration(order,'pk_test_example','https://sikka.example/payment/return?order=17');assert.equal(config.amount,2900);assert.deepEqual(config.metadata,{order_id:'17'});
 response={...order,status:'PAID',verifiedAt:'2026-10-26T17:00:00',moyasarPaymentId:'payment-123'};const confirmed=await payments.paymentApi.confirm(17,'payment-123');assert.equal(confirmed.status,'PAID');assert.equal(requests.at(-1).options.body,JSON.stringify({paymentId:'payment-123'}));
 assert.throws(()=>payments.checkoutConfiguration({...order,status:'PAID'},'pk_test_example','https://sikka.example/payment/return'));
 assert.throws(()=>payments.checkoutConfiguration(order,'sk_live_do_not_expose','https://sikka.example/payment/return'));
 assert.throws(()=>payments.checkoutConfiguration(order,'pk_test_example','http://sikka.example/payment/return'));
 await assert.rejects(()=>payments.paymentApi.confirm(0,'payment-123'));await assert.rejects(()=>payments.paymentApi.confirm(17,'bad id?'));
 response={message:'Login required'};status=401;await assert.rejects(()=>client.apiRequest('/api/v1/visit/my-visits'),e=>e.status===401);assert.equal(client.hasAuthentication(),false);
 status=200;response={id:3,name:'QA',email:'qa@example.test'};await client.authenticate('qa@example.test','again');client.clearAuthentication();await client.apiRequest('/api/v1/account/me');assert.equal(requests.at(-1).options.headers.Authorization,undefined);
 // Gateway never accepts a target from the browser, leaks an Authorization header in its response, or forwards cross-origin writes.
 const gateway=load('app/api/backend/[...path]/route');delete process.env.SIKKA_BACKEND_URL;
 assert.equal((await gateway.GET(new Request('https://sikka.example/api/backend/api/v1/account/me'),{params:Promise.resolve({path:['api','v1','account','me']})})).status,503);
 process.env.SIKKA_BACKEND_URL='https://backend.example';const context={params:Promise.resolve({path:['api','v1','payment-order','add','9']})};
 assert.equal((await gateway.POST(new Request('https://sikka.example/api/backend/api/v1/payment-order/add/9',{method:'POST',headers:{Origin:'https://evil.example'}}),context)).status,403);
 const upstream=[];global.fetch=async(url,options)=>{upstream.push({url:String(url),options});return new Response(JSON.stringify({id:17}),{headers:{'Content-Type':'application/json','Set-Cookie':'private=secret'}});};
 const result=await gateway.POST(new Request('http://localhost:3000/api/backend/api/v1/payment-order/add/9',{method:'POST',headers:{Host:'sikka.example',Origin:'https://sikka.example',Authorization:'Basic example','Content-Type':'application/json'},body:'{}'}),context);
 assert.equal(result.status,200);assert.equal(upstream[0].url,'https://backend.example/api/v1/payment-order/add/9');assert.equal(upstream[0].options.headers.get('authorization'),'Basic example');assert.equal(result.headers.get('set-cookie'),null);assert.equal(result.headers.get('cache-control'),'no-store');
 assert.equal((await gateway.GET(new Request('https://sikka.example/api/backend/x'),{params:Promise.resolve({path:['api','v1','..','admin']})})).status,400);
 console.log('Passed real request contracts, server-priced payments, server verification, in-memory auth expiry and same-origin gateway protections.');
})().catch(e=>{console.error(e);process.exitCode=1;});
