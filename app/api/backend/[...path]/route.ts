// Same-origin gateway. The target is controlled only by server configuration, never request input.
export const runtime='nodejs';
type Context={params:Promise<{path:string[]}>};
async function forward(request:Request,context:Context){
 const configured=process.env.SIKKA_BACKEND_URL;
 if(!configured)return Response.json({message:'اتصال الخادم غير مضبوط'},{status:503});
 const base=new URL(configured);const local=['localhost','127.0.0.1'].includes(base.hostname)||base.hostname.endsWith('.railway.internal');
 if(base.username||base.password||base.search||base.hash||base.pathname!=='/'||(base.protocol!=='https:'&&!(base.protocol==='http:'&&local)))return Response.json({message:'إعداد اتصال الخادم غير صالح'},{status:503});
 const {path}=await context.params;
 if(path[0]!=='api'||path[1]!=='v1'||path.some(p=>p==='.'||p==='..'||p.includes('/')||p.includes('\\')))return Response.json({message:'مسار غير صالح'},{status:400});
 const origin=request.headers.get('origin');if(origin){let source:URL;try{source=new URL(origin);}catch{return Response.json({message:'الطلب غير مسموح'},{status:403});}const host=request.headers.get('host')||new URL(request.url).host;if(source.host!==host||!['https:','http:'].includes(source.protocol))return Response.json({message:'الطلب غير مسموح'},{status:403});}
 const target=new URL('/'+path.map(encodeURIComponent).join('/'),base);target.search=new URL(request.url).search;
 const headers=new Headers();const cookie=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('JSESSIONID='));if(cookie)headers.set('cookie',cookie);for(const name of ['authorization','content-type','accept']){const value=request.headers.get(name);if(value)headers.set(name,value);}
 try{
  const upstream=await fetch(target,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer(),redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(115000)});
  if(upstream.status>=300&&upstream.status<400)return Response.json({message:'تعذر إكمال طلب الخدمة'},{status:502});
  const resultHeaders=new Headers({'Cache-Control':'no-store'});for(const name of ['content-type','content-disposition']){const value=upstream.headers.get(name);if(value)resultHeaders.set(name,value);}
  const sessionCookies=upstream.headers.getSetCookie?.()||[];for(const raw of sessionCookies){if(!raw.startsWith('JSESSIONID='))continue;const parts=raw.split(';').map(v=>v.trim()).filter(v=>!/^(path|domain|samesite|httponly|secure)=?/i.test(v));const secure=new URL(request.url).protocol==='https:'||request.headers.get('x-forwarded-proto')==='https';resultHeaders.append('Set-Cookie',parts.join('; ')+'; Path=/; HttpOnly; SameSite=Lax'+(secure?'; Secure':''));}
  return new Response(upstream.status===204?null:upstream.body,{status:upstream.status,headers:resultHeaders});
 }catch{return Response.json({message:'تعذر الاتصال بسكة. راجع حالة العملية قبل إعادة المحاولة.'},{status:502});}
}
export const GET=forward;
export const POST=forward;
export const PUT=forward;
export const DELETE=forward;
