// Browser authentication uses the backend session via an HttpOnly cookie; credentials are never persisted.
let sessionKnown=false;
export class SikkaApiError extends Error {
 constructor(message:string,public status:number){super(message);this.name='SikkaApiError';}
}
export const apiConfigured=()=>!!process.env.NEXT_PUBLIC_SIKKA_API_URL;
export function clearAuthentication(){sessionKnown=false;}
export function hasAuthentication(){return sessionKnown;}
function apiUrl(path:string){
 const base=process.env.NEXT_PUBLIC_SIKKA_API_URL?.replace(/\/$/,'');
 if(!base)throw new Error('لم يتم ضبط اتصال سكة بالخادم');
 if(!path.startsWith('/api/v1/'))throw new Error('مسار الخدمة غير صالح');
 return base+path;
}
export async function apiResponse(path:string,method='GET',body?:unknown){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),120000);
 try{
  const response=await fetch(apiUrl(path),{method,credentials:'include',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json',...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body!==undefined?JSON.stringify(body):undefined});
  if(!response.ok){const value=await response.json().catch(()=>null);if(response.status===401)clearAuthentication();throw new SikkaApiError((value&&typeof value==='object'&&'message' in value?String(value.message):'')||(response.status===401?'سجل دخولك لإكمال الطلب':'تعذر إكمال الطلب'),response.status);}
  return response;
 }catch(error){if(error instanceof Error&&error.name==='AbortError')throw new Error('انتهت مهلة الاتصال. حدّث حالة الطلب قبل المحاولة مجددًا.');throw error;}finally{clearTimeout(timeout);}
}
export async function apiRequest(path:string,method='GET',body?:unknown){const response=await apiResponse(path,method,body);return response.status===204?null:response.json();}
export type CurrentAccount={id:number;name:string;email:string;role:'USER'|'ADMIN';emailVerified:boolean};
export async function authenticate(email:string,password:string):Promise<CurrentAccount>{
 clearAuthentication();
 const response=await fetch(apiUrl('/api/v1/auth/login'),{method:'POST',credentials:'include',cache:'no-store',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username:email,password})});
 if(!response.ok){const value=await response.json().catch(()=>null);throw new SikkaApiError(value&&typeof value==='object'&&'message' in value?String(value.message):'تعذر تسجيل الدخول',response.status);}
 const account=await apiRequest('/api/v1/account/me') as CurrentAccount;if(!Number.isInteger(account.id)||account.id<=0)throw new Error('تعذر قراءة الحساب');
 sessionKnown=true;return account;
}
export async function logout(){await apiRequest('/api/v1/auth/logout','POST');clearAuthentication();}
