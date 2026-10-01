"use client";
import {motion,MotionProps} from "framer-motion";
import type {Certification,Education,Experience,Project,SkillGroup,Social} from "@/lib/types";
import {Copy,Locale,assetUrl,localized,localizedList} from "./copy";

type BaseProps={t:Copy;locale:Locale;active:boolean;inert:boolean|undefined;initial:string;onClose:()=>void};

function hasProjectDetail(project:Project,locale:Locale){
  return Boolean(localized(project,"problem",locale)||localized(project,"body",locale)||localizedList(project,"highlights",locale).length||localized(project,"outcome",locale)||project.live_url||project.github_url);
}

function CloseStrip({variant,initial,back,name,onClose}:{variant:string;initial:string;back:string;name:string;onClose:()=>void}){
  return <button type="button" className={`page-strip strip-${variant}`} onClick={onClose} aria-label={`${back}: ${name}`}><span className="strip-monogram" aria-hidden="true">{initial}</span><span className="strip-x"><svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg></span><span className="strip-label">{name}</span></button>;
}

export function WorkSection({t,locale,active,inert,initial,onClose,featuredProjects,otherProjects,cardMotion,openProject}:BaseProps&{featuredProjects:Project[];otherProjects:Project[];cardMotion:(index:number)=>MotionProps;openProject:(project:Project,el:HTMLButtonElement|null)=>void}){
  return <div className={`page section-work${active?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={!active} inert={inert} aria-label={t.nav[2]}>
    <div className="page-body">
      <h1 className="page-h">{t.work}</h1>
      <div className="page-sub">{t.workNote}</div>
      {otherProjects.length>0&&<details className="other-work">
        <summary className="other-work-summary"><span className="other-work-intro"><strong>{t.otherWorks}</strong><span>{t.otherWorksNote}</span></span><span className="other-work-toggle" aria-hidden="true"/></summary>
        <div className="other-work-list">{otherProjects.map(project=>{
          const hasDetail=hasProjectDetail(project,locale);
          return <button type="button" className="other-work-item" key={project.id} onClick={hasDetail?event=>openProject(project,event.currentTarget):undefined} aria-haspopup={hasDetail?"dialog":undefined} data-interactive={hasDetail?"true":"false"}>
            <span className="other-work-copy"><strong>{localized(project,"name",locale)}</strong><span>{localized(project,"description",locale)}</span></span>
            <span className="other-work-tech">{project.tech_stack?.slice(0,3).join(" · ")}</span>
            {hasDetail&&<span className="other-work-arrow" aria-hidden="true">→</span>}
          </button>;
        })}</div>
      </details>}
      <div className="work-grid">
        {featuredProjects.map((project,index)=>{
          const hasDetail=hasProjectDetail(project,locale);
          return <motion.button {...(active?cardMotion(index):{})} type="button" className="proj-card" key={project.id} onClick={hasDetail?event=>openProject(project,event.currentTarget):undefined} aria-haspopup={hasDetail?"dialog":undefined} data-interactive={hasDetail?"true":"false"}>
            <span className="proj-card-inner">
              {(project.open_source||project.github_url)&&<span className="proj-oss">{t.openSource}</span>}
              <span className="proj-name">{localized(project,"name",locale)}</span>
              <span className="proj-desc">{localized(project,"description",locale)}</span>
              <span className="proj-meta">{[project.category,project.employer,project.year].filter(Boolean).join(" · ")}</span>
              <span className="proj-tags">{project.tech_stack?.slice(0,5).map(tag=><span className="ptag" key={tag}>{tag}</span>)}{project.tech_stack&&project.tech_stack.length>5&&<span className="ptag ptag-more">+{project.tech_stack.length-5}</span>}</span>
              {hasDetail&&<span className="proj-more">{t.detail} →</span>}
            </span>
          </motion.button>;
        })}
      </div>
    </div>
    <CloseStrip variant="work" initial={initial} back={t.back} name={t.nav[2]} onClose={onClose}/>
  </div>;
}

export function ExperienceSection({t,locale,active,inert,initial,onClose,experiences}:BaseProps&{experiences:Experience[]}){
  return <div className={`page section-experience${active?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={!active} inert={inert} aria-label={t.nav[1]}>
    <div className="page-body">
      <h1 className="page-h">{t.experience}</h1>
      <div className="page-sub">{t.experienceNote}</div>
      <div className="experience-list">{experiences.map(item=>{
        const ongoing=!item.end_date||item.end_date.toLowerCase()==="present";
        return <div className="exp-item" key={item.id}>
        <div className="exp-date">{item.start_date}<br/>— {ongoing?t.present:item.end_date}</div>
        <div>
          <div className="exp-role">{localized(item,"role",locale)}{ongoing&&<span className="exp-current">{t.current}</span>}</div>
          <div className="exp-org">{item.company}</div>
          <div className="exp-desc">{localized(item,"description",locale)}</div>
          <div className="exp-tags">{item.tech_stack?.map(tag=><span className="ptag" key={tag}>{tag}</span>)}</div>
        </div>
      </div>;
      })}</div>
    </div>
    <CloseStrip variant="experience" initial={initial} back={t.back} name={t.nav[1]} onClose={onClose}/>
  </div>;
}

export function AboutSection({t,locale,active,inert,initial,onClose,settingsText,skills,education,certifications,cvDocuments}:BaseProps&{settingsText:(key:string)=>string;skills:SkillGroup[];education:Education[];certifications:Certification[];cvDocuments:import("@/lib/types").DocumentItem[]}){
  return <div className={`page section-about${active?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={!active} inert={inert} aria-label={t.nav[0]}>
    <div className="page-body">
      <h1 className="page-h">{t.about}</h1>
      <div className="about-lead">{settingsText("about_lead")}</div>
      <div className="long-copy">{settingsText("about_body")}</div>
      {settingsText("availability")&&<span className="hand-note">{settingsText("availability")}</span>}
      {skills.length>0&&<section className="about-section skills-section" aria-labelledby="skills-heading">
        <h2 className="about-section-title" id="skills-heading">{t.skills}</h2>
        <div className="matrix-card"><div className="matrix-groups">{skills.map(group=><div className="matrix-row" key={group.id}><div className="matrix-key">{localized(group,"group",locale)||group.group}</div><div className="matrix-val">{group.items?.join(", ")}</div></div>)}</div></div>
      </section>}
      <div className="about-cols">
        <section className="about-col" aria-labelledby="education-heading">
          <h2 className="about-section-title" id="education-heading">{t.education}</h2>
          {education.map(item=>{
            const educationDate=[item.start_date,item.end_date].filter(Boolean).join(" — ");
            const educationDetail=localized(item,"detail",locale);
            return <div className="ab-item" key={item.id}>
              <div className="ab-main">{localized(item,"school",locale)}</div>
              <div className="ab-sub">{[localized(item,"degree",locale),educationDate].filter(Boolean).join(" · ")}</div>
              {educationDetail&&<div className="ab-detail">{educationDetail}</div>}
            </div>;
          })}
        </section>
        <section className="about-col" aria-labelledby="certifications-heading">
          <h2 className="about-section-title" id="certifications-heading">{t.certs}</h2>
          {certifications.map(cert=><div className="ab-item" key={cert.id}><div className="ab-main">{localized(cert,"name",locale)}{typeof cert.attachment_url==="string"&&cert.attachment_url?<a className="cert-link" href={assetUrl(cert.attachment_url)} target="_blank" rel="noreferrer">PDF ↗</a>:null}</div><div className="ab-sub">{cert.issuer} {cert.year}</div></div>)}
        </section>
      </div>
      {cvDocuments.length>0&&<section className="resume-cta" aria-labelledby="resume-heading">
        <div className="resume-copy"><h2 id="resume-heading">{t.library}</h2><p>{t.libraryNote}</p></div>
        <div className="resume-actions">{cvDocuments.map((document,index)=><a className={`resume-link${index===0?" is-primary":""}`} href={assetUrl(document.file_url)} target="_blank" rel="noreferrer" key={document.id}>{localized(document,"title",locale)} <span aria-hidden="true">↗</span></a>)}</div>
      </section>}
    </div>
    <CloseStrip variant="about" initial={initial} back={t.back} name={t.nav[0]} onClose={onClose}/>
  </div>;
}

export function ContactSection({t,locale,active,inert,initial,onClose,settingsText,emailLink,otherLinks}:BaseProps&{settingsText:(key:string)=>string;emailLink:Social|undefined;otherLinks:Social[]}){
  return <div className={`page section-contact contact-page${active?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={!active} inert={inert} aria-label={t.nav[3]}>
    <div className="page-body">
      <h1 className="page-h">{t.contact}</h1>
      <div className="contact-card">
        {settingsText("availability")&&<p className="ct-avail">{settingsText("availability")}</p>}
        {emailLink&&<a className="ct-email" href={emailLink.url}>{emailLink.url.replace(/^mailto:/,"")}</a>}
        <div className="ct-links">{otherLinks.map(link=><a className="ct-link" href={link.url} key={link.id} target={link.url.startsWith("http")?"_blank":undefined} rel="noreferrer"><span className="ct-lbl">{localized(link,"label",locale)||link.label}</span><span>{link.url.replace(/^https?:\/\//,"")}</span><span aria-hidden="true">↗</span></a>)}</div>
      </div>
    </div>
    <CloseStrip variant="contact" initial={initial} back={t.back} name={t.nav[3]} onClose={onClose}/>
  </div>;
}
