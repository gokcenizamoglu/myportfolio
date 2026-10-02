"use client";
import {RefObject} from "react";
import Link from "next/link";
import {motion} from "framer-motion";
import type {Project} from "@/lib/types";
import {Copy,Locale,assetUrl,localized,localizedList,projectPeriod,safeExternalUrl,statusLabel} from "./copy";

export default function ProjectModal({project,locale,t,reduce,closeRef,onClose}:{project:Project;locale:Locale;t:Copy;reduce:boolean|null;closeRef:RefObject<HTMLButtonElement|null>;onClose:()=>void}){
  const p=project;
  const body=localized(p,"body",locale);
  const problem=localized(p,"problem",locale);
  const highlights=localizedList(p,"highlights",locale);
  const outcome=localized(p,"outcome",locale);
  const role=localized(p,"role",locale);
  const technicalNotes=localizedList(p,"technical_notes",locale);
  const liveUrl=safeExternalUrl(p.live_url);const githubUrl=safeExternalUrl(p.github_url);
  return <motion.div className="proj-modal" role="dialog" aria-modal="true" aria-label={localized(p,"name",locale)} initial={reduce?{opacity:0}:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.2}} onClick={onClose}>
    <motion.div className="proj-modal-card" onClick={event=>event.stopPropagation()} initial={reduce?{opacity:0}:{opacity:0,y:24,scale:.98}} animate={reduce?{opacity:1}:{opacity:1,y:0,scale:1}} exit={reduce?{opacity:0}:{opacity:0,y:16,scale:.98}} transition={{duration:.3,ease:[0.22,1,0.36,1]}}>
      <button type="button" ref={closeRef} className="proj-modal-close" onClick={onClose} aria-label={t.close}><svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>
      <div className="proj-modal-meta">{[statusLabel(p.status,locale),p.employer,projectPeriod(p,locale)||p.year].filter(Boolean).join(" · ")}</div>
      <h2 className="proj-modal-title">{localized(p,"name",locale)}</h2>
      {role&&<p className="proj-modal-role"><span className="proj-modal-k">{t.role}</span>{role}</p>}
      <p className="proj-modal-desc">{localized(p,"description",locale)}</p>
      {problem&&<div className="proj-modal-block"><div className="proj-modal-k">{t.problem}</div><p>{problem}</p></div>}
      {body&&<div className="proj-modal-block"><div className="proj-modal-k">{t.overview}</div><p>{body}</p></div>}
      {highlights.length>0&&<div className="proj-modal-block"><div className="proj-modal-k">{t.highlights}</div><ul className="proj-modal-highlights">{highlights.map((item,index)=><li key={`${index}-${item}`}>{item}</li>)}</ul></div>}
      {outcome&&<div className="proj-modal-block proj-modal-outcome"><div className="proj-modal-k">{t.outcome}</div><p>{outcome}</p></div>}
      {technicalNotes.length>0&&<div className="proj-modal-block"><div className="proj-modal-k">{t.technical}</div>{technicalNotes.map((note,index)=><p key={`${index}-${note}`}>{note}</p>)}</div>}
      {p.tech_stack&&p.tech_stack.length>0&&<div className="proj-modal-block"><div className="proj-modal-k">{t.stack}</div><div className="proj-tags">{p.tech_stack.map(tag=><span className="ptag" key={tag}>{tag}</span>)}</div></div>}
      {(liveUrl||githubUrl||p.presentation_url)&&<div className="proj-modal-actions">
        {liveUrl&&<a className="proj-modal-visit" href={liveUrl} target="_blank" rel="noreferrer"><span aria-hidden="true">◎</span>{localized(p,"live_url_label",locale)||t.visit} ↗</a>}
        {githubUrl&&<a className="proj-modal-visit proj-modal-source" href={githubUrl} target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.88c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.55 9.55 0 0 1 12 6.82a9.5 9.5 0 0 1 2.5.34c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>{t.source}</a>}
        {p.presentation_url&&<a className="proj-modal-visit proj-modal-source" href={assetUrl(p.presentation_url)} target="_blank" rel="noreferrer">{t.presentation} ↗</a>}
      </div>}
      <Link className="proj-permalink" href={`/${locale}/projects/${p.slug}`}>{locale==="tr"?"Kalıcı proje sayfası":"Permanent project page"} →</Link>
    </motion.div>
  </motion.div>;
}
