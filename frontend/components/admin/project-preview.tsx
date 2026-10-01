"use client";
import {useEffect,useRef,useState} from "react";
import type {Item,LanguageTab} from "./schema";

const copy={tr:{role:"Rolüm",problem:"Problem",overview:"Katkım / çözüm",highlights:"Öne çıkanlar",outcome:"Sonuç",stack:"Teknolojiler",visit:"Projeyi görüntüle",source:"Kaynak kod",close:"Önizlemeyi kapat"},en:{role:"My role",problem:"Problem",overview:"Contribution / solution",highlights:"Highlights",outcome:"Outcome",stack:"Technologies",visit:"View project",source:"Source code",close:"Close preview"}};
function text(item:Item,key:string,locale:LanguageTab,fallback=""){return String(item.data[`${key}_${locale}`]||item.data[`${key}_${locale==="tr"?"en":"tr"}`]||item.data[key]||fallback)}
function lines(item:Item,key:string,locale:LanguageTab){const value=item.data[`${key}_${locale}`]||item.data[`${key}_${locale==="tr"?"en":"tr"}`]||item.data[key];return Array.isArray(value)?value.map(String):String(value||"").split("\n").map(entry=>entry.trim()).filter(Boolean)}

export function ProjectCardPreview({item,locale}:{item:Item;locale:LanguageTab}){
  const tags=Array.isArray(item.data.tech_stack)?item.data.tech_stack.map(String):[];
  return <div className="admin-preview-stage"><article className="admin-site-project-card" lang={locale}>
    {(item.data.open_source===true||Boolean(item.data.github_url))&&<span className="proj-oss">{locale==="tr"?"Açık kaynak":"Open source"}</span>}
    <strong>{text(item,"name",locale,locale==="tr"?"Proje adı":"Project name")}</strong>
    <p>{text(item,"description",locale,locale==="tr"?"Kısa proje açıklaması burada görünecek.":"A short project description will appear here.")}</p>
    <small>{[item.data.category,item.data.employer,item.data.year].filter(Boolean).map(String).join(" · ")||"Kategori · Şirket · Yıl"}</small>
    <div>{tags.slice(0,5).map(tag=><span key={tag}>{tag}</span>)}{tags.length>5&&<span>+{tags.length-5}</span>}</div>
  </article></div>;
}

export default function ProjectPreview({item,locale,onClose}:{item:Item;locale:LanguageTab;onClose:()=>void}){
  const [view,setView]=useState<"card"|"detail">("detail");const dialogRef=useRef<HTMLDivElement>(null);const closeRef=useRef<HTMLButtonElement>(null);const previousFocus=useRef<HTMLElement|null>(null);const c=copy[locale];const tags=Array.isArray(item.data.tech_stack)?item.data.tech_stack.map(String):[];
  useEffect(()=>{previousFocus.current=document.activeElement as HTMLElement;closeRef.current?.focus();const key=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();if(event.key!=="Tab"||!dialogRef.current)return;const focusable=[...dialogRef.current.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hasAttribute("disabled"));if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};document.addEventListener("keydown",key);return()=>{document.removeEventListener("keydown",key);previousFocus.current?.focus()}},[onClose]);
  return <div className="admin-preview-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><div className="admin-preview-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="preview-title">
    <header><div><span>Kaydedilmemiş içerik önizlemesi</span><strong id="preview-title">{text(item,"name",locale,"Proje önizlemesi")}</strong></div><div className="admin-preview-switch" role="group" aria-label="Önizleme türü"><button type="button" className={view==="card"?"active":""} onClick={()=>setView("card")}>Kart</button><button type="button" className={view==="detail"?"active":""} onClick={()=>setView("detail")}>Detay</button></div><button type="button" ref={closeRef} className="admin-preview-close" onClick={onClose} aria-label={c.close}>×</button></header>
    <div className="admin-preview-canvas">{view==="card"?<ProjectCardPreview item={item} locale={locale}/>:<article className="admin-site-project-detail" lang={locale}>
      <div className="proj-modal-meta">{[item.data.category,item.data.employer,item.data.year].filter(Boolean).map(String).join(" · ")}</div><h2>{text(item,"name",locale,locale==="tr"?"Proje adı":"Project name")}</h2>
      {text(item,"role",locale)&&<p className="admin-detail-role"><b>{c.role}</b>{text(item,"role",locale)}</p>}<p className="admin-detail-lead">{text(item,"description",locale,locale==="tr"?"Kısa proje açıklaması burada görünecek.":"A short project description will appear here.")}</p>
      {(["problem","body","outcome"] as const).map(key=>text(item,key,locale)&&<section key={key}><b>{key==="problem"?c.problem:key==="body"?c.overview:c.outcome}</b><p>{text(item,key,locale)}</p></section>)}
      {lines(item,"highlights",locale).length>0&&<section><b>{c.highlights}</b><ul>{lines(item,"highlights",locale).map((line,index)=><li key={`${index}-${line}`}>{line}</li>)}</ul></section>}
      {tags.length>0&&<section><b>{c.stack}</b><div className="admin-detail-tags">{tags.map(tag=><span key={tag}>{tag}</span>)}</div></section>}
      {(Boolean(item.data.live_url)||Boolean(item.data.github_url))&&<footer>{Boolean(item.data.live_url)&&<span>{c.visit} ↗</span>}{Boolean(item.data.github_url)&&<span>{c.source} ↗</span>}</footer>}
    </article>}</div>
  </div></div>;
}
