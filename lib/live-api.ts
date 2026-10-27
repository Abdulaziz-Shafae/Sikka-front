import {apiRequest,SikkaApiError} from './api-client';
import type {ApiPlanDetails,ApiPlanItem,GenerationResult} from './backend-contract';
export type LiveVisit={id:number;name:string;visitDate:string;durationMinutes:number;maxParticipants:number;tripType:'SOLO'|'FRIENDS'|'FAMILY';togetherMode:'TOGETHER'|'SPLIT'|null;primaryGoal:string;includePrayer:boolean;status:'DRAFT'|'PLANNING'|'READY'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED';membersLocked:boolean;organizerAccountId:number;plannedStartTime:string|null;expectedArrivalTime:string|null};
export type Member={id:number;visitorProfileId:number|null;name:string;rsvpStatus:string};
export type Profile={id:number;accountId:number;name:string;birthDate:string|null;heightCm:number|null;weightKg:number|null;gender:string|null;thrillPreference:string|null;preferredRideTypes:string|null;dislikedRideFeatures:string|null;foodPreferences:string|null};
export type LiveRide={availabilitySource?:string|null;minHeightCm?:number|null;maxHeightCm?:number|null;warnings?:string|null;id:number;sourceRideId:string;name:string;status:string;category:string;land:string;waitMinutes:number|null;waitObservedAt:string|null;waitSource:string|null;rideFeatures:string[]};
export type Place={id:number;sourcePlaceId:string;name:string;kind:string;status:string};
export type RecordRow={id:number;planItemId:number;visitMemberId:number;status:string;rating:number|null;activitySessionId:number|null};
export type Session={id:number;planItemId:number;visitMemberId:number;status:string;trackingMode:string;isRateable:boolean;rating:number|null};
export type MealBreak={id:number;breakKey:string;mealChoice:string;preferredTiming:string;visitMemberId:number;placeId:number|null;planItemId:number|null};
export type FamilyMember={id:number;name:string;birthDate:string;heightCm:number|null;weightKg:number|null;gender:string};
export type Consent={id:number;consentKind:string;granted:boolean;policyVersion:string};
export type Notice={id:number;visitId:number;title:string;message:string;type:string;readAt:string|null;respondedAt:string|null;actionType:string|null};
export type MapSegment={visitMemberId:number;toPlanItemId:number;available:boolean;estimated:boolean;route?:{points:number[][];distanceMeters:number};reason?:string};
export type RouteData={segments:MapSegment[];planItems:ApiPlanItem[]};
export type CreateVisit={name:string;groupName?:string;visitDate:string;durationMinutes:number;maxParticipants:number;tripType:string;togetherMode:string|null;primaryGoal:string;includePrayer:boolean;goals:string};
export const request=<T>(path:string,method='GET',body?:unknown)=>apiRequest('/api/v1/'+path,method,body) as Promise<T>;
export const liveApi={
 rides:()=>request<LiveRide[]>('ride/get'),
 places:async()=>{const rows=await Promise.all(['RESTAURANT','PRAYER_ROOM','RESTROOM'].map(kind=>request<Place[]>('place/by-kind?kind='+kind)));return rows.flat();},
 visits:()=>request<LiveVisit[]>('visit/my-visits'),
 visit:(id:number)=>request<LiveVisit>('visit/details/'+id),
 create:(dto:CreateVisit)=>request<{message:string}>('visit/create','POST',dto),
 update:(id:number,dto:CreateVisit)=>request('visit/update-visit/'+id,'PUT',dto),
 delete:(id:number)=>request('visit/delete/'+id,'DELETE'),
 preferences:(id:number)=>request<{selectedRides:{rideId:number;priority:'MUST_RIDE'|'PREFERRED'|'OPTIONAL'}[];dislikedFeatures:string[];answerStatus:string}>('visit-member/preferences/'+id),
 profile:()=>request<Profile>('visitor-profile/my-profile'),
 updateProfile:(dto:unknown)=>request('visitor-profile/update-my-profile','PUT',dto),
 members:(id:number)=>request<{members:Member[];total:number;goingCount:number}>('visit-member/summary/'+id),
 join:(code:string)=>request('visit-member/join','POST',{code}),
 rsvp:(id:number,value:'going'|'maybe'|'not-going')=>request(`visit-member/rsvp/${value}/${id}`,'PUT'),
 leave:(id:number)=>request('visit-member/leave/'+id,'DELETE'),
 removeMember:(id:number,memberId:number)=>request(`visit-member/remove/${id}/${memberId}`,'DELETE'),
 family:()=>request<FamilyMember[]>('family-member/get/my'),
 saveFamily:(dto:unknown,id?:number)=>request(id?'family-member/update/'+id:'family-member/add',id?'PUT':'POST',dto),
 deleteFamily:(id:number)=>request('family-member/delete/'+id,'DELETE'),
 addFamily:(id:number,ids:number[])=>request('visit-member/add-family/'+id,'POST',{familyMemberIds:ids}),
 regenerateCode:(id:number)=>request<{message:string}>('visit-group/regenerate-code/'+id,'PUT'),
 plans:(id:number)=>request<{id:number;planKind:string;isActive:boolean}[]>('visit-plan/get/plans/'+id),
 ownPlan:(id:number)=>request<ApiPlanDetails>('visit-plan/get/my-individual-plan/'+id),
 groupPlan:(id:number)=>request<ApiPlanDetails>('visit-plan/get/approved-group-plan/'+id),
 details:(id:number)=>request<ApiPlanDetails>('visit-plan/get/details/'+id),
 createApproval:(id:number)=>request('plan-approval/create/'+id,'POST'),
 records:async(id:number)=>{try{return await request<RecordRow[]>('visit-record/get/my-records/'+id);}catch(e){if(e instanceof SikkaApiError&&e.status===400&&e.message==='No ride records found for this visit')return [];throw e;}},
 sessions:(id:number)=>request<Session[]>('activity-session/history/'+id),
 progress:(id:number)=>request<{completionPercentage:number;remainingRidesCount:number;completedActivitiesCount:number;skippedActivitiesCount:number;remainingActivitiesCount:number}>('visit-record/progress/'+id),
 mealBreaks:(id:number)=>request<MealBreak[]>('visit-meal-break/get/my/'+id),
 restaurant:(id:number,key:string,placeId:number)=>request(`visit-meal-break/restaurant/${id}/${encodeURIComponent(key)}`,'PUT',{placeId}),
 mapRoute:(id:number)=>request<RouteData>('visit-plan/get/map-route/'+id),
 consents:()=>request<Consent[]>('privacy-consent/get/my/consents'),
 consent:(consentKind:string)=>request('privacy-consent/add','POST',{consentKind,granted:true,policyVersion:process.env.NEXT_PUBLIC_CONSENT_POLICY_VERSION||'1.0'}),
 revokeConsent:(id:number)=>request('privacy-consent/revoke/'+id,'PUT'),
 notices:()=>request<Notice[]>('notification/get/my-notifications'),
 register:(dto:unknown)=>request<{message:string;verificationEmailSent?:boolean}>('account/register','POST',dto),
 next:(id:number)=>request<{activityStatus:string;activity:ApiPlanItem|null;activitySession:Session|null}>('visit-plan/next-activity/'+id),
 startFamily:(itemId:number,ids:number[],gps=false)=>request<Session[]>('activity-session/start/manual/family/'+itemId,'POST',{visitMemberIds:ids}),
 completeFamily:(id:number,ids:number[],requestKey:string)=>request('activity-session/complete/family/'+id,'POST',{visitMemberIds:ids,requestKey}),
 startGps:(memberId:number,itemId:number)=>request<Session>(`activity-session/start/gps/${memberId}/${itemId}`,'POST'),
 updateLocation:(visitId:number,latitude:number,longitude:number,accuracyMeters:number)=>request<Session>('activity-session/location/'+visitId,'PUT',{latitude,longitude,accuracyMeters,capturedAt:new Date().toISOString()}),
 generate:(id:number,key:string)=>request<GenerationResult>('visit-plan/generate/'+id,'POST',{requestKey:key}),
};
// A request key survives an uncertain network outcome, but never stores credentials or profile data.
export function operationKey(scope:string){const key='sikka-request:'+scope;let value=sessionStorage.getItem(key);if(!value){value=crypto.randomUUID();sessionStorage.setItem(key,value);}return value;}
export function finishOperation(scope:string){sessionStorage.removeItem('sikka-request:'+scope);}
export function mayEditMember(visit:LiveVisit,accountId:number,profileId:number,member:Member){return member.rsvpStatus==='GOING'&&(member.visitorProfileId===profileId||(visit.tripType==='FAMILY'&&visit.organizerAccountId===accountId&&member.visitorProfileId===null));}
export function executionState(itemId:number,memberId:number,records:RecordRow[],sessions:Session[]){const record=records.find(r=>r.planItemId===itemId&&r.visitMemberId===memberId);const session=sessions.find(s=>s.planItemId===itemId&&s.visitMemberId===memberId);return {record,session,status:record?.status||session?.status||'UPCOMING'};}

export async function fetchVisiblePlan(visit:LiveVisit,accountId:number,scope='default'){const leader=visit.organizerAccountId===accountId;if(scope==='mine'||!leader&&scope!=='group')return liveApi.ownPlan(visit.id);if(scope==='group'&&!leader)return liveApi.groupPlan(visit.id);const plans=await liveApi.plans(visit.id);const candidate=plans.filter(p=>p.planKind==='GROUP').sort((a,b)=>Number(b.isActive)-Number(a.isActive)||b.id-a.id)[0];if(!candidate)throw new Error('لم تتولد خطة لهذه الزيارة بعد');return liveApi.details(candidate.id);}
