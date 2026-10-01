export type HealthIssue={code:string;severity:"critical"|"warning";kind:string;id?:number;slug?:string;locale?:"tr"|"en";field?:string;message:string};
export type HealthReport={score:number;issue_count:number;critical_count:number;by_kind:Record<string,number>;issues:HealthIssue[]};

export function healthStatus(score:number){
  if(score>=85)return "İçerik iyi durumda";
  if(score>=60)return "Bazı alanlar tamamlanmalı";
  return "Yayın öncesi düzenleme gerekiyor";
}

export function hasCriticalPublicationIssues(visible:boolean,issues:HealthIssue[]){
  return visible&&issues.some(issue=>issue.severity==="critical");
}
