import {apiRequest} from './sikka-api';
import type {RidePriority,UiActivity,UiPlan} from './planning-ui';

export type ApiRide={id:number;sourceRideId:string;name:string;status:'OPEN'|'CLOSED'|'UNAVAILABLE';waitMinutes:number|null;waitObservedAt:string|null;mapX:number|null;mapY:number|null};
export type ApiMember={id:number;name:string;rsvpStatus:'GOING'|'MAYBE'|'NOT_GOING'|'INVITED';visitorProfileId:number|null};
export type ApiPlanItem={id:number;activityKind:'RIDE'|'BREAK'|'PLACE'|'MEETING_POINT';rideId:number|null;placeId:number|null;title:string;relativeStartMinutes:number;relativeEndMinutes:number;walkingMinutes:number;waitingMinutes:number;activityMinutes:number;breakType:'MEAL'|'SNACK'|'PRAYER'|null;participantVisitMemberIds:number[]|string;startsAt:string|null;endsAt:string|null;priority:RidePriority|null;pinned:boolean;isRateable:boolean;sortOrder:number};
export type ApiExcludedRide={rideId:number;rideName:string;visitMemberId:number;priority:RidePriority;reasonCode:string;reasonMessage:string};
export type ApiPlanDetails={plan:{id:number;visitId:number;planKind:'GROUP'|'INDIVIDUAL';ownerVisitMemberId:number|null;timingMode:'RELATIVE'|'SCHEDULED';isActive:boolean};approvalStatus:'PENDING'|'APPROVED'|'REJECTED';planItems:ApiPlanItem[];excludedRides:ApiExcludedRide[];proposedPlanItems:ApiPlanItem[];pendingProposal:null|{proposalKey:string;requestedByAccountId:number;requiredApproverAccountId:number;approvalScope:'GROUP'|'INDIVIDUAL';affectedMemberIds:number[]}};
export type GenerationResult={visitId:number;requestStatus:'PROCESSING'|'SUCCEEDED'|'FAILED';groupPlanId:number|null;failureReason:string|null;generatedResult:null|{feasible:boolean;activities:unknown[];warnings:string[];excludedRides:ApiExcludedRide[]}};
function positive(id:number){if(!Number.isInteger(id)||id<=0)throw new Error('معرّف الخادم غير صالح');return id;}
export function participantIds(value:number[]|string):number[]{let parsed:unknown=value;if(typeof value==='string'){try{parsed=JSON.parse(value);}catch{throw new Error('قائمة المشاركين غير صالحة');}}if(!Array.isArray(parsed)||!parsed.length||parsed.some(x=>!Number.isInteger(x)||x<=0)||new Set(parsed).size!==parsed.length)throw new Error('قائمة المشاركين غير صالحة');return parsed;}
// Never infer a server ride ID from the ordering of the local catalogue.
export function preferencesPayload(choices:{slug:string;priority:RidePriority}[],catalogue:ApiRide[],dislikedFeatures:string[]=[]){return {selectedRides:choices.map(c=>{const ride=catalogue.find(r=>r.sourceRideId===c.slug);if(!ride)throw new Error('اللعبة غير موجودة في كتالوج الخادم: '+c.slug);return {rideId:positive(ride.id),priority:c.priority};}),dislikedFeatures};}
export function normalizeStoredPlan(details:ApiPlanDetails,catalogue:ApiRide[],members:ApiMember[]):UiPlan{
 const labels=new Map(members.map(m=>[m.id,m.name]));
 function activity(item:ApiPlanItem):UiActivity{
  const ids=participantIds(item.participantVisitMemberIds);if(ids.some(id=>!labels.has(id)))throw new Error('النشاط يشير لمشارك غير معروف');
  for(const n of [item.relativeStartMinutes,item.relativeEndMinutes,item.walkingMinutes,item.waitingMinutes,item.activityMinutes])if(!Number.isInteger(n)||n<0)throw new Error('أوقات النشاط غير صالحة');
  if(item.relativeEndMinutes-item.relativeStartMinutes!==item.walkingMinutes+item.waitingMinutes+item.activityMinutes)throw new Error('مدد النشاط لا تطابق توقيته');
  const ride=item.rideId?catalogue.find(r=>r.id===item.rideId):undefined;
  return {key:'plan-item-'+item.id,planItemId:item.id,rideId:item.rideId||undefined,placeId:item.placeId||undefined,rideSlug:ride?.sourceRideId,title:item.title,kind:item.activityKind==='BREAK'?item.breakType||'PLACE':item.activityKind,start:item.relativeStartMinutes,end:item.relativeEndMinutes,walking:item.walkingMinutes,waiting:item.waitingMinutes,duration:item.activityMinutes,participants:ids.map(String),priority:item.priority||undefined,pinned:item.pinned,records:{},startsAt:item.startsAt||undefined,endsAt:item.endsAt||undefined,rateable:item.isRateable};
 }
 const activities=details.planItems.map(activity).sort((a,b)=>a.start-b.start);
 const excluded=(details.excludedRides||[]).map(x=>({rideId:x.rideId,rideSlug:catalogue.find(r=>r.id===x.rideId)?.sourceRideId,title:x.rideName,member:String(x.visitMemberId),priority:x.priority,reasonCode:x.reasonCode,reason:x.reasonMessage||'لم يصل سبب موثّق من الخادم؛ نحتاج مراجعة الخطة.'}));
 // Execution status requires VisitRecord/ActivitySession data; schedule order is not proof of completion.
 const plan:UiPlan={source:'SERVER',activities,excluded,warnings:[],approved:details.approvalStatus==='APPROVED'};
 if(details.pendingProposal)plan.proposal={key:details.pendingProposal.proposalKey,requestedBy:String(details.pendingProposal.requestedByAccountId),scope:details.pendingProposal.approvalScope,reason:'مقترح من الخادم',activities:details.proposedPlanItems.map(activity),excluded};
 return plan;
}
export const backendApi={
 preview:(id:number)=>apiRequest(`/api/v1/visit/preview/${positive(id)}`),
 members:(id:number)=>apiRequest(`/api/v1/visit-member/summary/${positive(id)}`),
 memberPreferences:(id:number,dto:ReturnType<typeof preferencesPayload>)=>apiRequest(`/api/v1/visit-member/preferences/${positive(id)}`,'PUT',dto),
 skipPreferences:(id:number)=>apiRequest(`/api/v1/visit-member/preferences/skip/${positive(id)}`,'PUT'),
 mealPreferences:(id:number,dto:unknown)=>apiRequest(`/api/v1/visit-meal-break/preferences/${positive(id)}`,'PUT',dto),
 generate:(id:number,requestKey:string)=>apiRequest(`/api/v1/visit-plan/generate/${positive(id)}`,'POST',{requestKey}) as Promise<GenerationResult>,
 regenerate:(id:number,requestKey:string)=>apiRequest(`/api/v1/visit-plan/regenerate/group/${positive(id)}`,'POST',{requestKey}) as Promise<GenerationResult>,
 details:(id:number)=>apiRequest(`/api/v1/visit-plan/get/details/${positive(id)}`) as Promise<ApiPlanDetails>,
 individual:(id:number)=>apiRequest(`/api/v1/visit-plan/get/my-individual-plan/${positive(id)}`),
 group:(id:number)=>apiRequest(`/api/v1/visit-plan/get/approved-group-plan/${positive(id)}`),
 mapRoute:(id:number)=>apiRequest(`/api/v1/visit-plan/get/map-route/${positive(id)}`),
 suggestReplan:(id:number,reason:string,replaceUnavailableRides=false)=>apiRequest(`/api/v1/visit-plan/suggest-replan/${positive(id)}`,'POST',{reason,replaceUnavailableRides}),
 approve:(visitPlanId:number,proposalKey?:string)=>apiRequest('/api/v1/plan-approval/approve','PUT',{visitPlanId:positive(visitPlanId),...(proposalKey?{proposalKey}:{})}),
 reject:(visitPlanId:number,proposalKey?:string)=>apiRequest('/api/v1/plan-approval/reject','PUT',{visitPlanId:positive(visitPlanId),...(proposalKey?{proposalKey}:{})}),
 arrival:(id:number,expectedArrivalTime:string,mealPreferences?:unknown)=>apiRequest(`/api/v1/visit/arrival/${positive(id)}`,'PUT',{expectedArrivalTime,...(mealPreferences?{mealPreferences}:{})}),
 start:(id:number)=>apiRequest(`/api/v1/visit/start/${positive(id)}`,'PUT'),
 finish:(id:number)=>apiRequest(`/api/v1/visit/complete/${positive(id)}`,'PUT'),
 cancel:(id:number)=>apiRequest(`/api/v1/visit/cancel/${positive(id)}`,'PUT'),
 nextActivity:(id:number)=>apiRequest(`/api/v1/visit-plan/next-activity/${positive(id)}`),
 activityHistory:(id:number)=>apiRequest(`/api/v1/activity-session/history/${positive(id)}`),
 startActivity:(memberId:number,itemId:number)=>apiRequest(`/api/v1/activity-session/start/manual/${positive(memberId)}/${positive(itemId)}`,'POST'),
 completeRide:(id:number,dto:unknown)=>apiRequest(`/api/v1/visit-record/complete/${positive(id)}`,'POST',dto),
 skipRide:(id:number,dto:unknown)=>apiRequest(`/api/v1/visit-record/skip/${positive(id)}`,'POST',dto),
 correctCompleted:(dto:unknown)=>apiRequest('/api/v1/visit-record/update/complete','PUT',dto),
 correctSkipped:(dto:unknown)=>apiRequest('/api/v1/visit-record/update/skip','PUT',dto),
 rateRide:(dto:unknown)=>apiRequest('/api/v1/visit-record/rate','PUT',dto),
 completeActivity:(id:number,requestKey:string)=>apiRequest(`/api/v1/activity-session/complete/${positive(id)}`,'POST',{requestKey}),
 rateActivity:(id:number,dto:unknown)=>apiRequest(`/api/v1/activity-session/rate/${positive(id)}`,'PUT',dto),
 review:(id:number,dto:unknown)=>apiRequest(`/api/v1/visit-member/review/${positive(id)}`,'PUT',dto),
 reuse:(id:number,visitDate:string)=>apiRequest(`/api/v1/visit/reuse/${positive(id)}`,'POST',{visitDate}),
 progress:(id:number)=>apiRequest(`/api/v1/visit-record/progress/${positive(id)}`),
 paymentOrders:(id:number)=>apiRequest(`/api/v1/payment-order/get/visit/${positive(id)}`),
 createOrder:(id:number)=>apiRequest(`/api/v1/payment-order/add/${positive(id)}`,'POST'),
 confirmPayment:(id:number,paymentId:string)=>apiRequest(`/api/v1/payment-order/confirm/${positive(id)}`,'POST',{paymentId}),
 notifications:()=>apiRequest('/api/v1/notification/get/my-notifications'),
 markRead:(id:number)=>apiRequest(`/api/v1/notification/read/${positive(id)}`,'PUT'),
 respondDelay:(id:number,reason:string,adjustPlan:boolean)=>apiRequest(`/api/v1/notification/respond-delay/${positive(id)}`,'PUT',{reason,adjustPlan}),
 verifyEmail:(email:string,code:string)=>apiRequest('/api/v1/auth/verify-email','POST',{email,code}),
 resendVerification:(email:string)=>apiRequest('/api/v1/auth/resend-verification','POST',{email}),
 forgotPassword:(email:string)=>apiRequest('/api/v1/auth/forgot-password','POST',{email}),
 resetPassword:(dto:unknown)=>apiRequest('/api/v1/auth/reset-password','POST',dto),
};
