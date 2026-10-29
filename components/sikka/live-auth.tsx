'use client';
import {toast} from 'sonner';
import {FeedbackError} from './feedback';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {authenticate,apiConfigured,type CurrentAccount} from '@/lib/api-client';
import {backendApi} from '@/lib/backend-contract';
import {liveApi} from '@/lib/live-api';
import {Field,type Mutate} from './live-forms';
export function LiveAuth({page,busy,mutate,onLogin,navigate,initialEmail}:{initialEmail?:string;page:string;busy:boolean;mutate:Mutate;onLogin:(a:CurrentAccount,target?:string)=>void;navigate:(p:string)=>void}){
 const [email,setEmail]=useState(initialEmail||''),[notice,setNotice]=useState('');
 useEffect(()=>{if(initialEmail)setEmail(initialEmail);},[initialEmail]);
 return <div className="container page-space narrow-page"><form className="profile-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);await mutate(async()=>{
  if(page==='signup'){await liveApi.register({name:String(f.get('name')),email:email.trim(),password:String(f.get('password'))});toast.success('حياك في سكة! حسابك جاهز، كمّل ملفك واهتماماتك.');try{const account=await authenticate(email.trim(),String(f.get('password')));form.reset();onLogin(account,'profile');}catch{setNotice('تم إنشاء حسابك. سجّل الدخول لإكمال ملفك.');navigate('login');}}

  else if(page==='verify'){await backendApi.verifyEmail(email,String(f.get('code')));navigate('login');}
  else if(page==='forgot'){await backendApi.forgotPassword(email);navigate('reset');}
  else if(page==='reset'){await backendApi.resetPassword({email,code:String(f.get('code')),newPassword:String(f.get('password'))});form.reset();navigate('login');}
  else{const account=await authenticate(email.trim(),String(f.get('password')));form.reset();onLogin(account);}
 },page==='signup'?undefined:page==='login'?'حيّاك في سكة':page==='forgot'?'تم استلام طلب الاستعادة':'تمت العملية من سكة');}}>
 <h1>{page==='signup'?'سكتك تبدأ هنا':page==='verify'?'أكد بريدك':page==='forgot'?'نرجعك لحسابك':page==='reset'?'كلمة مرور جديدة':'حيّاك من جديد'}</h1>
 {notice&&<FeedbackError message={notice}/>}
 {page==='signup'&&<Field label="اسمك"><Input name="name" required maxLength={100} autoComplete="name"/></Field>}
 <Field label="البريد الإلكتروني"><Input name="email" value={email} onChange={e=>setEmail(e.target.value)} type="email" required autoComplete="username"/></Field>
 {['verify','reset'].includes(page)&&<Field label="رمز التأكيد"><Input name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code"/></Field>}
 {['login','signup','reset'].includes(page)&&<Field label="كلمة المرور"><Input name="password" type="password" required minLength={8} autoComplete={page==='login'?'current-password':'new-password'}/></Field>}
 {!apiConfigured()&&<FeedbackError message="خادم سكة غير مضبوط في هذه النسخة."/>}<Button disabled={busy||!apiConfigured()} type="submit">{busy?'لحظات…':page==='login'?'ادخل':page==='signup'?'إنشاء حساب':page==='verify'?'تفعيل الحساب':page==='forgot'?'اطلب رمز الاستعادة':'تأكيد'}</Button>
 {page==='verify'&&<p className="inline-note">إذا هذي أول مرة تطلب رمز التفعيل وما وصلك، اطلبه مرة ثانية بعد دقيقتين. شيّك البريد غير المرغوب فيه أيضًا.</p>}
 {page==='verify'&&<Button type="button" variant="outline" disabled={busy||!email} onClick={()=>mutate(()=>backendApi.resendVerification(email),'تم استلام طلب إعادة الإرسال')}>أعد إرسال الرمز</Button>}
 <div className="readiness-actions"><Button type="button" variant="ghost" onClick={()=>navigate(page==='login'?'signup':'login')}>{page==='login'?'إنشاء حساب':'تسجيل الدخول'}</Button><Button type="button" variant="ghost" onClick={()=>navigate('forgot')}>نسيت كلمة المرور</Button></div>
 </form></div>;
}
