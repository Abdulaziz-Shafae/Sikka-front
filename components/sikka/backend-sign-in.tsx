'use client';
import {useState} from 'react';
import {authenticate,apiConfigured,type CurrentAccount} from '@/lib/api-client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export function BackendSignIn({onAuthenticated}:{onAuthenticated:(account:CurrentAccount)=>void}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 return <form className="readiness-panel" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const values=new FormData(form);setBusy(true);setError('');try{const account=await authenticate(String(values.get('email')),String(values.get('password')));form.reset();onAuthenticated(account);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>
  <h2>سجّل دخولك لحساب سكة</h2><p>نتحقق من حسابك في سكة. تظل الجلسة محفوظة حتى تنتهي صلاحيتها أو تسجّل خروجك.</p>
  <label>البريد الإلكتروني<Input name="email" type="email" autoComplete="username" required disabled={busy}/></label>
  <label>كلمة المرور<Input name="password" type="password" autoComplete="current-password" required disabled={busy}/></label>
  {error&&<p role="alert">{error}</p>}{!apiConfigured()&&<p role="alert">اتصال الخادم غير مضبوط بعد.</p>}
  <Button disabled={busy||!apiConfigured()} type="submit">{busy?'نتحقق من حسابك…':'تسجيل الدخول'}</Button>
 </form>;
}
