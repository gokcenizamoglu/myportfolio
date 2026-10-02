"use client";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import {AnimatePresence,motion,MotionProps,useReducedMotion} from "framer-motion";
import type {PortfolioData,Project} from "@/lib/types";
import {Locale,copy,assetUrl,localized} from "@/components/portfolio/copy";
import {AboutSection,ContactSection,ExperienceSection,WorkSection} from "@/components/portfolio/sections";
import ProjectModal from "@/components/portfolio/project-modal";
import {trackAnalyticsEvent} from "@/lib/analytics";

type Section="about"|"experience"|"work"|"contact";

export default function Portfolio({initialData,locale}:{initialData:PortfolioData|null;locale:Locale}){
  const t=copy[locale];
  const reduce=useReducedMotion();
  const [activeSection,setActiveSection]=useState<Section|null>(null);
  const [activeProject,setActiveProject]=useState<Project|null>(null);
  const lastTileRef=useRef<HTMLButtonElement|null>(null);
  const lastCardRef=useRef<HTMLButtonElement|null>(null);
  const modalCloseRef=useRef<HTMLButtonElement|null>(null);

  useEffect(()=>{document.documentElement.lang=locale;trackAnalyticsEvent("page_view",locale,`/${locale}`)},[locale]);

  useEffect(()=>{
    const locked=activeSection||activeProject;
    document.body.style.overflow=locked?"hidden":"";
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){
        if(activeProject){setActiveProject(null);return}
        if(activeSection)setActiveSection(null);
        return;
      }
      if(event.key!=="Tab")return;
      const container=document.querySelector<HTMLElement>(activeProject?".proj-modal":activeSection?".page.is-active":"");
      if(!container)return;
      const focusable=[...container.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>element.offsetParent!==null);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    };
    window.addEventListener("keydown",onKey);
    return()=>{document.body.style.overflow="";window.removeEventListener("keydown",onKey)};
  },[activeSection,activeProject]);

  // Return focus to the originating control when overlays close.
  useEffect(()=>{if(activeSection)requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(".page.is-active .page-strip")?.focus());else lastTileRef.current?.focus()},[activeSection]);
  useEffect(()=>{
    if(activeProject){modalCloseRef.current?.focus()}
    else lastCardRef.current?.focus();
  },[activeProject]);

  if(!initialData)return <main className="offline"><Image src="/brand/ggu.png" width={256} height={256} alt="Gökçe Güler"/><h1>{t.apiOffline}</h1><p>{t.apiHelp}</p><a href={`/${locale}`}>{locale==="tr"?"Tekrar dene":"Try again"}</a></main>;
  const d=initialData,s=d.settings;
  const settingsText=(key:string)=>s[`${key}_${locale}`]||s[key]||"";
  const nameLogo=assetUrl(s.logo_wordmark_url)||"/brand/ggu.png";
  const initials=locale==="tr"?["H","D","P","İ"]:["A","E","P","C"];
  const tiles:{kind:Section;label:string;description:string;initial:string}[]=[
    {kind:"about",label:t.nav[0],description:t.navDesc[0],initial:initials[0]},
    {kind:"experience",label:t.nav[1],description:t.navDesc[1],initial:initials[1]},
    {kind:"work",label:t.nav[2],description:t.navDesc[2],initial:initials[2]},
    {kind:"contact",label:t.nav[3],description:t.navDesc[3],initial:initials[3]},
  ];
  const projects=d.projects||[];
  const featuredProjects=projects.filter(project=>project.featured===true);
  const otherProjects=projects.filter(project=>project.featured!==true);
  const cvDocuments=(d.documents||[]).filter(document=>document.category==="cv");
  const emailLink=d.socials.find(link=>link.url.startsWith("mailto:"));
  const otherLinks=d.socials.filter(link=>link!==emailLink);
  const openSection=(kind:Section,el:HTMLButtonElement|null)=>{lastTileRef.current=el;setActiveSection(kind);trackAnalyticsEvent("section_view",locale,`/${locale}#${kind}`)};
  const openProject=(project:Project,el:HTMLButtonElement|null)=>{lastCardRef.current=el;setActiveProject(project);trackAnalyticsEvent("project_view",locale,`/${locale}#projects`,project.slug)};
  // Keep hidden layers out of the tab order: opacity/transform alone leave
  // their links focusable. `inert` removes them for keyboard and AT users.
  const overlayOpen=Boolean(activeSection)||Boolean(activeProject);
  const sectionInert=(kind:Section)=>activeSection!==kind||Boolean(activeProject)||undefined;
  const tileMotion=(index:number):MotionProps=>reduce?{}:{initial:{opacity:0,y:14},animate:{opacity:1,y:0},transition:{duration:.5,delay:.06*index,ease:[0.22,1,0.36,1]as const}};
  const cardMotion=(index:number):MotionProps=>reduce?{}:{initial:{opacity:0,y:16},animate:{opacity:1,y:0},transition:{duration:.4,delay:.04*index,ease:[0.22,1,0.36,1]as const}};

  return <main className="gg-shell" data-open={activeSection?"true":"false"}>
    <nav className="gg-lang" aria-label="Language"><Link className={locale==="tr"?"active":""} href="/tr">TR</Link><span>/</span><Link className={locale==="en"?"active":""} href="/en">EN</Link></nav>

    <div className="gg-base" inert={overlayOpen||undefined}>
      <div className="gg-inner">
        <h1 className="sr-only">{s.name||"Gökçe Güler"} — {settingsText("title")}</h1>
        <Image className="gg-logo" src={nameLogo} width={460} height={310} priority sizes="(max-width: 860px) 72vw, 320px" unoptimized={!nameLogo.startsWith("/")} alt={s.name||"Gökçe Güler"}/>
        <div className="gg-details">
          <p className="gg-role">{settingsText("title")}<span className="gg-role-dot">.</span></p>
          <p className="gg-tagline">{settingsText("tagline")}</p>
          <div className="gg-social">{d.socials.map(link=><a href={link.url} key={link.id} target={link.url.startsWith("http")?"_blank":undefined} rel="noreferrer">{localized(link,"label",locale)||link.label}</a>)}</div>
          <span className="gg-location">{s.location}</span>
        </div>
      </div>
    </div>

    <nav className="gg-grid" aria-label="Portfolio sections" inert={overlayOpen||undefined}>
      {tiles.map((tile,index)=><motion.button {...tileMotion(index)} type="button" className={`pnl pnl-${tile.kind}`} onClick={event=>openSection(tile.kind,event.currentTarget)} key={tile.kind}>
        <span className="pnl-inner">
          <span className="pnl-monogram" aria-hidden="true">{tile.initial}</span>
          <span className="pnl-copy"><span className="pnl-title">{tile.label}</span><span className="pnl-desc">{tile.description}</span></span>
        </span>
      </motion.button>)}
    </nav>

    <WorkSection t={t} locale={locale} active={activeSection==="work"} inert={sectionInert("work")} initial={initials[2]} onClose={()=>setActiveSection(null)} featuredProjects={featuredProjects} otherProjects={otherProjects} cardMotion={cardMotion} openProject={openProject}/>
    <ExperienceSection t={t} locale={locale} active={activeSection==="experience"} inert={sectionInert("experience")} initial={initials[1]} onClose={()=>setActiveSection(null)} experiences={d.experiences}/>
    <AboutSection t={t} locale={locale} active={activeSection==="about"} inert={sectionInert("about")} initial={initials[0]} onClose={()=>setActiveSection(null)} settingsText={settingsText} skills={d.skills} education={d.education} certifications={d.certifications} articles={d.articles||[]} cvDocuments={cvDocuments}/>
    <ContactSection t={t} locale={locale} active={activeSection==="contact"} inert={sectionInert("contact")} initial={initials[3]} onClose={()=>setActiveSection(null)} settingsText={settingsText} emailLink={emailLink} otherLinks={otherLinks}/>

    <AnimatePresence>
      {activeProject&&<ProjectModal project={activeProject} locale={locale} t={t} reduce={reduce} closeRef={modalCloseRef} onClose={()=>setActiveProject(null)}/>}
    </AnimatePresence>
  </main>
}
