// UI gates only. Server authentication and authorization remain authoritative.
export function isAccountPage(route:string){return ['visits','profile','family','preferences','notifications'].includes(route.split('/')[0]);}
export function saudiToday(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
