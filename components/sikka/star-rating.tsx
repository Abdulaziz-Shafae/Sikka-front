'use client';
import {useState} from 'react';
import {Star} from 'lucide-react';
export function StarRating({name,label,defaultValue=0,disabled=false}:{name:string;label:string;defaultValue?:number;disabled?:boolean}){
 const [value,setValue]=useState(defaultValue);
 return <fieldset disabled={disabled} className="sikka-star-rating"><legend>{label}</legend><input type="number" name={name} value={value||''} min={1} max={5} required onChange={e=>setValue(Math.max(0,Math.min(5,Number(e.target.value))))} tabIndex={-1} aria-label={label} className="sr-only"/><div role="group" aria-label={label} className="flex gap-2 py-2">{[1,2,3,4,5].map(star=><button key={star} type="button" aria-label={`${star} من 5`} aria-pressed={value===star} onClick={()=>setValue(star)} className="p-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"><Star size={30} color={star<=value?'#c48708':'#94a3b8'} fill={star<=value?'#facc15':'#d1d5db'}/></button>)}</div></fieldset>;
}
