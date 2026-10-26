import {buildDemoPlan} from './planning-ui';
import type {Visit} from './sikka-data';
export function finishDemoGeneration(visit:Visit|undefined,update:(patch:Partial<Visit>)=>void,navigate:(page:string)=>void){
 if(!visit)return;
 if(!visit.approved)update({status:'GENERATED',planning:buildDemoPlan(visit)});
 navigate('plan');
}
