const http=require('node:http'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'../..');const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const seen=[];const backend=http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;seen.push({path:req.url,authorization:req.headers.authorization,body:JSON.parse(body||'{}')});res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({id:17,status:'PAID',amountSar:29,verifiedAt:'2026-10-26T17:00:00'}));});
 await new Promise(r=>backend.listen(0,'127.0.0.1',r));const backendPort=backend.address().port;
 const probe=http.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const app=spawn(process.execPath,['scripts/railway-runtime.mjs','start'],{cwd:root,env:{...process.env,PORT:String(port),SIKKA_BACKEND_URL:`http://127.0.0.1:${backendPort}`},stdio:'ignore'});
 try{
  const base=`http://127.0.0.1:${port}`;let started=false;
  for(let i=0;i<80;i++){try{const r=await fetch(base+'/connect');if(r.ok){started=true;break;}}catch{}await pause(100);}assert.ok(started,'Production server did not start');
  for(const route of ['/','/connect','/checkout/9','/payment/return?order=17&id=payment-123']){const response=await fetch(base+route);assert.equal(response.status,200,route);await response.text();}
  const response=await fetch(base+'/api/backend/api/v1/payment-order/confirm/17',{method:'POST',headers:{Origin:base,Authorization:'Basic smoke-placeholder','Content-Type':'application/json'},body:JSON.stringify({paymentId:'payment-123'})});assert.equal(response.status,200);assert.equal((await response.json()).status,'PAID');
  assert.deepEqual(seen,[{path:'/api/v1/payment-order/confirm/17',authorization:'Basic smoke-placeholder',body:{paymentId:'payment-123'}}]);
  const blocked=await fetch(base+'/api/backend/api/v1/payment-order/confirm/17',{method:'POST',headers:{Origin:'https://other.example'}});assert.equal(blocked.status,403);assert.equal(seen.length,1);
  console.log('Passed Node production pages and payment gateway HTTP round-trip against a local mock backend. No real charge or external service was called.');
 }finally{app.kill('SIGTERM');await new Promise(r=>app.once('exit',r));backend.closeAllConnections();await new Promise(r=>backend.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
