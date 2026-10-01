import {apiBase} from "./api";

export type AnalyticsEventType="page_view"|"section_view"|"project_view";

export function trackAnalyticsEvent(eventType:AnalyticsEventType,locale:"tr"|"en",path:string,projectSlug=""){
  void fetch(`${apiBase}/api/v1/analytics/events`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({event_type:eventType,locale,path,project_slug:projectSlug}),
    keepalive:true,
    credentials:"omit",
  }).catch(()=>undefined);
}
