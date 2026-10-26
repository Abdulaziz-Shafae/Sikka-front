import graph from './park-routes.json';
// Place contract reviewed against SIKKA feature/final-flows-review.
export type Restaurant={id:number;name:string;kind:string;cuisineTypes:string[]};
export {apiRequest} from './api-client';
import {apiRequest} from './api-client';
// Live integration is explicit: setting the server URL alone does not replace demo data.
export const isDemoMode=process.env.NEXT_PUBLIC_SIKKA_DEMO_MODE==='true';
export const demoRestaurants:Restaurant[]=graph.places.filter(p=>p.kind==='RESTAURANT').map((p,i)=>({id:i+1,name:p.name,kind:p.kind,cuisineTypes:[['NORTH_AMERICAN','MIDDLE_EASTERN','MEXICAN','INDIAN','ITALIAN','PAN_ASIAN','MULTINATIONAL'][i%7]]}));
export const sikkaApi={restaurants:async():Promise<Restaurant[]>=>{if(isDemoMode)return demoRestaurants;const data=await apiRequest('/api/v1/place/by-kind?kind=RESTAURANT');if(!Array.isArray(data)||data.some(p=>typeof p.id!=='number'||typeof p.name!=='string'))throw new Error('بيانات المطاعم غير صالحة');return data.map(p=>({...p,cuisineTypes:Array.isArray(p.cuisineTypes)?p.cuisineTypes:[]}));},me:()=>apiRequest('/api/v1/account/me'),myVisits:()=>apiRequest('/api/v1/visit/my-visits'),createVisit:(dto:unknown)=>apiRequest('/api/v1/visit/create','POST',dto),plans:(id:number)=>apiRequest(`/api/v1/visit-plan/get/plans/${id}`),map:()=>apiRequest('/api/v1/map/get/data'),profile:()=>apiRequest('/api/v1/visitor-profile/my-profile')};
