'use client';
import {useEffect} from 'react';
import {Info} from 'lucide-react';
import {Toaster,toast} from 'sonner';
import {arabicMessage} from '@/lib/arabic-messages';
export function SikkaFeedback(){return <Toaster position="bottom-center" dir="rtl" closeButton visibleToasts={3} icons={{error:<Info size={20}/>,info:<Info size={20}/>,success:<Info size={20}/>,warning:<Info size={20}/>}} toastOptions={{className:'sikka-toast',duration:6500}} style={{zIndex:2147483647}}/>;}
export function FeedbackError({message}:{message:unknown}){const text=arabicMessage(message);useEffect(()=>{if(message)toast.error(text,{id:'sikka-error:'+text});},[message,text]);return null;}
