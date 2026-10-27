import type {Member,RecordRow,Session} from './live-api';
export function activityControls(status:string,session:Session|undefined,rating:number|null|undefined,dismissed:boolean){
 const finished=status==='COMPLETED'||status==='SKIPPED';
 return {start:!finished&&!session,complete:!finished&&session?.status==='ACTIVE',rate:status==='COMPLETED'&&!rating&&!dismissed};
}
export function completionParticipants(ids:number[],members:Member[],memberId:number,tripType:string,leader:boolean){
 return ids.filter(id=>members.some(member=>member.id===id&&member.rsvpStatus==='GOING'&&(id===memberId||tripType==='FAMILY'&&leader&&member.visitorProfileId===null||tripType==='FRIENDS'&&member.visitorProfileId!==null)));
}
export function activityFinished(itemId:number,memberId:number,records:RecordRow[],sessions:Session[]){
 const state=records.find(row=>row.planItemId===itemId&&row.visitMemberId===memberId)?.status||sessions.find(row=>row.planItemId===itemId&&row.visitMemberId===memberId)?.status;
 return state==='COMPLETED'||state==='SKIPPED';
}
