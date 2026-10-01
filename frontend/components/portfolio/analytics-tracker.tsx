"use client";
import {useEffect,useRef} from "react";
import {trackAnalyticsEvent} from "@/lib/analytics";

export default function AnalyticsTracker({locale,path,projectSlug}:{locale:"tr"|"en";path:string;projectSlug?:string}){
  const tracked=useRef(false);
  useEffect(()=>{
    if(tracked.current)return;
    tracked.current=true;
    trackAnalyticsEvent("page_view",locale,path);
    if(projectSlug)trackAnalyticsEvent("project_view",locale,path,projectSlug);
  },[locale,path,projectSlug]);
  return null;
}
