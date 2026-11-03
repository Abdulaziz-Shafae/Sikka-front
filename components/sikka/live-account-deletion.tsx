'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {apiRequest,clearAuthentication} from '@/lib/api-client';

export function LiveAccountDeletion({onDeleted}:{onDeleted:()=>void}){
 const [expanded,setExpanded]=useState(false);
 const [password,setPassword]=useState('');
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');

 async function erase(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy||!confirmed||!password)return;
  setBusy(true);setError('');
  try{
   await apiRequest('/api/v1/account/delete-my-account','POST',{password});
   setPassword('');clearAuthentication();onDeleted();
  }catch(reason){setError(reason instanceof Error?reason.message:'تعذر حذف الحساب. حاول مجددًا.');setBusy(false);}
 }
 return <section className="readiness-panel" aria-labelledby="account-deletion-heading">
  <h2 id="account-deletion-heading">حذف حسابي</h2>
  <p>حذف الحساب نهائي ولا يمكن استرجاع بياناته الشخصية. بيانات المشاركين الآخرين في الزيارات المشتركة تبقى لهم، لكن قد تتوقف إدارة الزيارة إذا كنت منظّمها.</p>
  {!expanded?<Button variant="outline" onClick={()=>setExpanded(true)}>طلب حذف الحساب</Button>:
  <form onSubmit={erase} className="profile-form">
   <label htmlFor="erase-password">كلمة المرور الحالية لتأكيد الحذف</label>
   <Input id="erase-password" type="password" autoComplete="current-password" required minLength={1} value={password} onChange={event=>setPassword(event.target.value)}/>
   <label className="flex gap-2 items-start"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)} required/>أفهم أن حذف الحساب نهائي ولن أستعيد بياناتي بعده</label>
   {error&&<p role="alert">{error}</p>}
   <div className="readiness-actions">
    <Button variant="destructive" type="submit" disabled={busy||!password||!confirmed}>{busy?'جارٍ حذف الحساب…':'حذف حسابي نهائيًا'}</Button>
    <Button variant="outline" type="button" disabled={busy} onClick={()=>{setExpanded(false);setPassword('');setConfirmed(false);setError('');}}>إلغاء</Button>
   </div>
  </form>}
 </section>;
}
