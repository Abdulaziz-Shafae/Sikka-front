'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {authenticate,apiConfigured,type CurrentAccount} from '@/lib/api-client';
import {backendApi} from '@/lib/backend-contract';
import {liveApi} from '@/lib/live-api';
import {Field,type Mutate} from './live-forms';
export function LiveAuth({page,busy,mutate,onLogin,navigate}:{page:string;busy:boolean;mutate:Mutate;onLogin:(a:CurrentAccount)=>void;navigate:(p:string)=>void}){
 const [email,setEmail]=useState('');
 return <div className="container page-space narrow-page"><form className="profile-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);await mutate(async()=>{
  if(page==='signup'){await liveApi.register({name:String(f.get('name')),email,password:String(f.get('password'))});form.reset();navigate('verify');}
  else if(page==='verify'){await backendApi.verifyEmail(email,String(f.get('code')));navigate('login');}
  else if(page==='forgot'){await backendApi.forgotPassword(email);navigate('reset');}
  else if(page==='reset'){await backendApi.resetPassword({email,code:String(f.get('code')),newPassword:String(f.get('password'))});form.reset();navigate('login');}
  else{const account=await authenticate(email,String(f.get('password')));form.reset();onLogin(account);}
 },page==='login'?'حيّاك في سكة':page==='forgot'?'تم استلام طلب الاستعادة':'تمت العملية من سكة');}}>
 <h1>{page==='signup'?'سكتك تبدأ هنا':page==='verify'?'أكد بريدك':page==='forgot'?'نرجعك لحسابك':page==='reset'?'كلمة مرور جديدة':'حيّاك من جديد'}</h1>
 {page==='signup'&&<Field label="اسمك"><Input name="name" required maxLength={100} autoComplete="name"/></Field>}
 <Field label="البريد الإلكتروني"><Input value={email} onChange={e=>setEmail(e.target.value)} type="email" required autoComplete="username"/></Field>
 {['verify','reset'].includes(page)&&<Field label="رمز التأكيد"><Input name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code"/></Field>}
 {['login','signup','reset'].includes(page)&&<Field label="كلمة المرور"><Input name="password" type="password" required minLength={8} autoComplete={page==='login'?'current-password':'new-password'}/></Field>}
 {!apiConfigured()&&<p role="alert">خادم سكة غير مضبوط في هذه النسخة.</p>}<Button disabled={busy||!apiConfigured()} type="submit">{busy?'لحظات…':page==='login'?'ادخل':page==='forgot'?'اطلب رمز الاستعادة':'تأكيد'}</Button>
 {page==='verify'&&<Button type="button" variant="outline" disabled={busy||!email} onClick={()=>mutate(()=>backendApi.resendVerification(email),'تم استلام طلب إعادة الإرسال')}>أعد إرسال الرمز</Button>}
 <div className="readiness-actions"><Button type="button" variant="ghost" onClick={()=>navigate(page==='login'?'signup':'login')}>{page==='login'?'إنشاء حساب':'تسجيل الدخول'}</Button><Button type="button" variant="ghost" onClick={()=>navigate('forgot')}>نسيت كلمة المرور</Button><Button type="button" variant="ghost" onClick={()=>navigate('verify')}>تفعيل البريد</Button></div>
 </form></div>;
}
