// Basic Auth is held only in memory. Reloading or returning from 3DS requires signing in again.
let authorization: string | undefined;
export class SikkaApiError extends Error {
 constructor(message:string,public status:number){super(message);this.name='SikkaApiError';}
}
export const apiConfigured=()=>!!process.env.NEXT_PUBLIC_SIKKA_API_URL;
export function clearAuthentication(){authorization=undefined;}
export function hasAuthentication(){return !!authorization;}
function apiUrl(path:string){
 const base=process.env.NEXT_PUBLIC_SIKKA_API_URL?.replace(/\/$/,'');
 if(!base)throw new Error('لم يتم ضبط اتصال سكة بالخادم');
 if(!path.startsWith('/api/v1/'))throw new Error('مسار الخدمة غير صالح');
 return base+path;
}
export async function apiResponse(path:string,method='GET',body?:unknown,auth=authorization){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),120000);
 try{
  const response=await fetch(apiUrl(path),{method,credentials:'include',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json',...(body!==undefined?{'Content-Type':'application/json'}:{}),...(auth?{Authorization:auth}:{})},body:body!==undefined?JSON.stringify(body):undefined});
  if(!response.ok){const value=await response.json().catch(()=>null);if(response.status===401)clearAuthentication();throw new SikkaApiError((value&&typeof value==='object'&&'message' in value?String(value.message):'')||(response.status===401?'سجل دخولك لإكمال الطلب':'تعذر إكمال الطلب'),response.status);}
  return response;
 }catch(error){if(error instanceof Error&&error.name==='AbortError')throw new Error('انتهت مهلة الاتصال. حدّث حالة الطلب قبل المحاولة مجددًا.');throw error;}finally{clearTimeout(timeout);}
}
export async function apiRequest(path:string,method='GET',body?:unknown){const response=await apiResponse(path,method,body);return response.status===204?null:response.json();}
export type CurrentAccount={id:number;name:string;email:string;role:'USER'|'ADMIN';emailVerified:boolean};
export async function authenticate(email:string,password:string):Promise<CurrentAccount>{
 clearAuthentication();
 const bytes=new TextEncoder().encode(email+':'+password);const candidate='Basic '+btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
 const response=await apiResponse('/api/v1/account/me','GET',undefined,candidate);
 const account:CurrentAccount=await response.json();if(!Number.isInteger(account.id)||account.id<=0)throw new Error('تعذر قراءة الحساب');
 authorization=candidate;return account;
}
