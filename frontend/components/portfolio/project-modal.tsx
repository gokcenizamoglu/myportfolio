"use client";
import {RefObject} from "react";
import Link from "next/link";
import {motion} from "framer-motion";
import type {Project} from "@/lib/types";
import {Copy,Locale,assetUrl,localized,localizedList,projectPeriod,safeExternalUrl,statusLabel} from "./copy";

export default function ProjectModal({project,locale,t,reduce,closeRef,onClose}:{project:Project;locale:Locale;t:Copy;reduce:boolean|null;closeRef:RefObject<HTMLButtonElement|null>;onClose:()=>void}){
  const highlights=localizedList(project,"highlights",locale);
  const outcome=localized(project,"outcome",locale);
  const role=localized(project,"role",locale);
  const liveUrl=safeExternalUrl(project.live_url);const githubUrl=safeExternalUrl(project.github_url);
  return <motion.div className="proj-modal" role="dialog" aria-modal="true" aria-label={localized(project,"name",locale)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.2}} onClick={onClose}>
    <motion.div className="proj-modal-card" onClick={event=>event.stopPropagation()} initial={reduce?{opacity:0}:{opacity:0,y:24,scale:.98}} animate={reduce?{opacity:1}:{opacity:1,y:0,scale:1}} exit={reduce?{opacity:0}:{opacity:0,y:16,scale:.98}} transition={{duration:.3,ease:[0.22,1,0.36,1]}}>
      <button type="button" ref={closeRef} className="proj-modal-close" onClick={onClose} aria-label={t.close}><svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>
      <header className="proj-modal-head"><div className="proj-modal-meta">{[statusLabel(project.status,locale),project.employer,projectPeriod(project,locale)||project.year].filter(Boolean).join(" · ")}</div><h2 className="proj-modal-title">{localized(project,"name",locale)}</h2>{role&&<p className="proj-modal-role">{role}</p>}<p className="proj-modal-desc">{localized(project,"description",locale)}</p></header>
      <div className="proj-modal-content">
        {highlights.length>0&&<div className="proj-modal-block"><div className="proj-modal-k">{t.highlights}</div><ul className="proj-modal-highlights">{highlights.slice(0,4).map((item,index)=><li key={`${index}-${item}`}>{item}</li>)}</ul></div>}
        {outcome&&<div className="proj-modal-block proj-modal-outcome"><div className="proj-modal-k">{t.outcome}</div><p>{outcome}</p></div>}
        {project.tech_stack&&project.tech_stack.length>0&&<div className="proj-modal-block"><div className="proj-modal-k">{t.stack}</div><div className="proj-tags">{project.tech_stack.slice(0,8).map(tag=><span className="ptag" key={tag}>{tag}</span>)}</div></div>}
        <div className="proj-modal-actions"><Link className="proj-modal-detail" href={`/${locale}/projects/${project.slug}`}>{locale==="tr"?"Tüm proje detaylarını aç":"Open full project details"}<span aria-hidden="true">→</span></Link>{liveUrl&&<a className="proj-modal-visit proj-modal-source" href={liveUrl} target="_blank" rel="noreferrer">{localized(project,"live_url_label",locale)||t.visit} ↗</a>}{githubUrl&&<a className="proj-modal-visit proj-modal-source" href={githubUrl} target="_blank" rel="noreferrer">{t.source} ↗</a>}{project.presentation_url&&<a className="proj-modal-visit proj-modal-source" href={assetUrl(project.presentation_url)} target="_blank" rel="noreferrer">{t.presentation} ↗</a>}</div>
      </div>
    </motion.div>
  </motion.div>;
}
