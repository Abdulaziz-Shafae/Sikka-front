'use client';
import {useEffect,useRef,type RefObject} from 'react';

// Ensures each Sikka dialog is keyboard-accessible without changing its appearance.
const focusable='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export function useModalFocus(open:boolean,onClose:()=>void):RefObject<HTMLElement|null>{
 const dialog=useRef<HTMLElement|null>(null);
 const close=useRef(onClose);
 close.current=onClose;
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const node=dialog.current;
  if(!node)return;
  const first=node.querySelector<HTMLElement>('[data-initial-focus]')||node.querySelector<HTMLElement>(focusable)||node;
  // Focus after mounting; tabIndex on the panel allows focus when no controls exist.
  first.focus();
  function onKey(event:KeyboardEvent){
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close.current();return;}
   if(event.key!=='Tab'||!node)return;
   const elements=[...node.querySelectorAll<HTMLElement>(focusable)].filter(el=>el.getClientRects().length>0);
   if(!elements.length){event.preventDefault();node.focus();return;}
   const start=elements[0],end=elements[elements.length-1];
   if(event.shiftKey&&(document.activeElement===start||!node.contains(document.activeElement))){event.preventDefault();end.focus();}
   else if(!event.shiftKey&&(document.activeElement===end||!node.contains(document.activeElement))){event.preventDefault();start.focus();}
  }
  function onFocus(event:FocusEvent){
   if(node&&!node.contains(event.target as Node)){(node.querySelector<HTMLElement>(focusable)||node).focus();}
  }
  document.addEventListener('keydown',onKey,true);
  document.addEventListener('focusin',onFocus);
  return()=>{document.removeEventListener('keydown',onKey,true);document.removeEventListener('focusin',onFocus);previous?.isConnected&&previous.focus();};
 },[open]);
 return dialog;
}
