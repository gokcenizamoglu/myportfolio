"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {AnimatePresence,motion,useReducedMotion} from "framer-motion";
import {apiBase} from "@/lib/api";
import type {PortfolioData,Project} from "@/lib/types";

type Locale="tr"|"en";
type Section="about"|"experience"|"work"|"contact";
const copy={
  tr:{nav:["Hakkımda","Deneyim","Projeler","İletişim"],navDesc:["Yaklaşımım, yetkinliklerim ve özgeçmişim","Roller, sorumluluklar ve üretim deneyimi","Ürünler, sistemler ve teknik detaylar","Bir fikir veya iş birliği için"],about:"Teknik yaklaşımım",work:"Geliştirdiğim seçkin sistemler",workNote:"Karmaşık iş akışlarını sade, güvenilir ürünlere dönüştürdüğüm bazı çalışmalar.",otherWorks:"Diğer Çalışmalar",otherWorksNote:"Daha küçük ölçekte geliştirdiğim araçlar, deneyler ve teknik üretimler.",experience:"Mühendislik deneyimlerim",experienceNote:"Ürün geliştirme, teknik koordinasyon ve production sorumluluğunun zaman içindeki gelişimi.",education:"Eğitim",skills:"Teknik yetkinlikler",certs:"Sertifikalar",library:"Özgeçmişimi incele",libraryNote:"Deneyimimin ayrıntılı dökümüne Türkçe veya İngilizce ulaşabilirsin.",contact:"Gelin birlikte tasarlayalım",open:"Aç / indir",close:"Kapat",back:"Geri",present:"Şu an",current:"Devam ediyor",apiOffline:"Portfolyo API’sine ulaşılamıyor.",apiHelp:"Go API’yi başlatınca içerikler burada görünecek.",detail:"Detayları gör",role:"Rol",problem:"Problem",overview:"Katkım",highlights:"Öne çıkanlar",outcome:"Sonuç",stack:"Teknolojiler",visit:"Ürün sitesini ziyaret et",source:"GitHub’da incele",openSource:"Açık kaynak"},
  en:{nav:["About","Experience","Projects","Contact"],navDesc:["Approach, capabilities and résumé","Roles, responsibilities and production work","Products, systems and technical details","For an idea or collaboration"],about:"My technical approach",work:"Selected systems I've built",workNote:"A few systems where I turned complicated operations into calm, dependable products.",otherWorks:"Other Work",otherWorksNote:"Smaller tools, experiments and technical work I've built along the way.",experience:"Engineering experience",experienceNote:"A progression through product delivery, technical coordination and production ownership.",education:"Education",skills:"Technical capabilities",certs:"Certifications",library:"View my résumé",libraryNote:"Explore a detailed account of my experience in Turkish or English.",contact:"Let's build something together",open:"Open / download",close:"Close",back:"Back",present:"Present",current:"In progress",apiOffline:"The portfolio API is offline.",apiHelp:"Start the Go API and the content will appear here.",detail:"View details",role:"Role",problem:"Problem",overview:"My contribution",highlights:"Highlights",outcome:"Outcome",stack:"Tech stack",visit:"Visit product site",source:"View on GitHub",openSource:"Open source"}
};

function localized(item:Record<string,unknown>,key:string,locale:Locale){return String(item[`${key}_${locale}`]??item[key]??"")}
function localizedList(item:Record<string,unknown>,key:string,locale:Locale){const value=item[`${key}_${locale}`]??item[key];if(Array.isArray(value))return value.map(String).filter(Boolean);if(typeof value==="string")return value.split(/\r?\n/).map(part=>part.trim()).filter(Boolean);return []}
function assetUrl(value?:string){if(!value)return "";if(value.startsWith("/uploads/"))return `${apiBase}${value}`;return value}
export default function Portfolio({initialData,locale}:{initialData:PortfolioData|null;locale:Locale}){
  const t=copy[locale];
  const reduce=useReducedMotion();
  const [activeSection,setActiveSection]=useState<Section|null>(null);
  const [activeProject,setActiveProject]=useState<Project|null>(null);
  const lastTileRef=useRef<HTMLButtonElement|null>(null);
  const lastCardRef=useRef<HTMLButtonElement|null>(null);
  const modalCloseRef=useRef<HTMLButtonElement|null>(null);

  useEffect(()=>{document.documentElement.lang=locale},[locale]);

  useEffect(()=>{
    const locked=activeSection||activeProject;
    document.body.style.overflow=locked?"hidden":"";
    const onKey=(event:KeyboardEvent)=>{
      if(event.key!=="Escape")return;
      if(activeProject){setActiveProject(null);return}
      if(activeSection)setActiveSection(null);
    };
    window.addEventListener("keydown",onKey);
    return()=>{document.body.style.overflow="";window.removeEventListener("keydown",onKey)};
  },[activeSection,activeProject]);

  // Return focus to the originating control when overlays close.
  useEffect(()=>{if(!activeSection)lastTileRef.current?.focus()},[activeSection]);
  useEffect(()=>{
    if(activeProject){modalCloseRef.current?.focus()}
    else lastCardRef.current?.focus();
  },[activeProject]);

  if(!initialData)return <main className="offline"><img src="/brand/ggu.png" alt=""/><h1>{t.apiOffline}</h1><p>{t.apiHelp}</p></main>;
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
  const openSection=(kind:Section,el:HTMLButtonElement|null)=>{lastTileRef.current=el;setActiveSection(kind)};
  const openProject=(project:Project,el:HTMLButtonElement|null)=>{lastCardRef.current=el;setActiveProject(project)};
  // Keep hidden layers out of the tab order: opacity/transform alone leave
  // their links focusable. `inert` removes them for keyboard and AT users.
  const overlayOpen=Boolean(activeSection)||Boolean(activeProject);
  const sectionInert=(kind:Section)=>activeSection!==kind||Boolean(activeProject)||undefined;
  const tileMotion=(index:number)=>reduce?{}:{initial:{opacity:0,y:14},animate:{opacity:1,y:0},transition:{duration:.5,delay:.06*index,ease:[0.22,1,0.36,1]as const}};
  const cardMotion=(index:number)=>reduce?{}:{initial:{opacity:0,y:16},animate:{opacity:1,y:0},transition:{duration:.4,delay:.04*index,ease:[0.22,1,0.36,1]as const}};

  return <main className="gg-shell" data-open={activeSection?"true":"false"}>
    <nav className="gg-lang" aria-label="Language"><Link className={locale==="tr"?"active":""} href="/tr">TR</Link><span>/</span><Link className={locale==="en"?"active":""} href="/en">EN</Link></nav>

    <div className="gg-base" inert={overlayOpen||undefined}>
      <div className="gg-inner">
        <img className="gg-logo" src={nameLogo} alt={s.name||"Gökçe Güler"}/>
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

    <div className={`page section-work${activeSection==="work"?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={activeSection!=="work"} inert={sectionInert("work")} aria-label={t.nav[2]}>
      <div className="page-body">
        <h1 className="page-h">{t.work}</h1>
        <div className="page-sub">{t.workNote}</div>
        <div className="work-grid">
          {featuredProjects.map((project,index)=>{
            const hasDetail=Boolean(localized(project,"problem",locale)||localized(project,"body",locale)||localizedList(project,"highlights",locale).length||localized(project,"outcome",locale)||project.live_url||project.github_url);
            return <motion.button {...(activeSection==="work"?cardMotion(index):{})} type="button" className="proj-card" key={project.id} onClick={hasDetail?event=>openProject(project,event.currentTarget):undefined} aria-haspopup={hasDetail?"dialog":undefined} data-interactive={hasDetail?"true":"false"}>
              <span className="proj-card-inner">
                <span className="proj-tag">{String(index+1).padStart(2,"0")}{project.featured&&<span className="proj-star" aria-label="featured">★</span>}{(project.open_source||project.github_url)&&<span className="proj-oss">{t.openSource}</span>}</span>
                <span className="proj-name">{localized(project,"name",locale)}</span>
                <span className="proj-desc">{localized(project,"description",locale)}</span>
                <span className="proj-meta">{[project.category,project.employer,project.year].filter(Boolean).join(" · ")}</span>
                <span className="proj-tags">{project.tech_stack?.slice(0,5).map(tag=><span className="ptag" key={tag}>{tag}</span>)}{project.tech_stack&&project.tech_stack.length>5&&<span className="ptag ptag-more">+{project.tech_stack.length-5}</span>}</span>
                {hasDetail&&<span className="proj-more">{t.detail} →</span>}
              </span>
            </motion.button>;
          })}
        </div>
        {otherProjects.length>0&&<section className="other-work" aria-labelledby="other-work-heading">
          <div className="other-work-heading"><div><h2 id="other-work-heading">{t.otherWorks}</h2><p>{t.otherWorksNote}</p></div><span>{String(otherProjects.length).padStart(2,"0")}</span></div>
          <div className="other-work-list">{otherProjects.map((project,index)=>{
            const hasDetail=Boolean(localized(project,"problem",locale)||localized(project,"body",locale)||localizedList(project,"highlights",locale).length||localized(project,"outcome",locale)||project.live_url||project.github_url);
            return <button type="button" className="other-work-item" key={project.id} onClick={hasDetail?event=>openProject(project,event.currentTarget):undefined} aria-haspopup={hasDetail?"dialog":undefined} data-interactive={hasDetail?"true":"false"}>
              <span className="other-work-index">{String(featuredProjects.length+index+1).padStart(2,"0")}</span>
              <span className="other-work-copy"><strong>{localized(project,"name",locale)}</strong><span>{localized(project,"description",locale)}</span></span>
              <span className="other-work-tech">{project.tech_stack?.slice(0,3).join(" · ")}</span>
              {hasDetail&&<span className="other-work-arrow" aria-hidden="true">→</span>}
            </button>;
          })}</div>
        </section>}
      </div>
      <button type="button" className="page-strip strip-work" onClick={()=>setActiveSection(null)} aria-label={`${t.back}: ${t.nav[2]}`}><span className="strip-monogram" aria-hidden="true">{initials[2]}</span><span className="strip-x"><svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg></span><span className="strip-label">{t.nav[2]}</span></button>
    </div>

    <div className={`page section-experience${activeSection==="experience"?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={activeSection!=="experience"} inert={sectionInert("experience")} aria-label={t.nav[1]}>
      <div className="page-body">
        <h1 className="page-h">{t.experience}</h1>
        <div className="page-sub">{t.experienceNote}</div>
        <div className="experience-list">{d.experiences.map(item=>{
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
      <button type="button" className="page-strip strip-experience" onClick={()=>setActiveSection(null)} aria-label={`${t.back}: ${t.nav[1]}`}><span className="strip-monogram" aria-hidden="true">{initials[1]}</span><span className="strip-x"><svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg></span><span className="strip-label">{t.nav[1]}</span></button>
    </div>

    <div className={`page section-about${activeSection==="about"?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={activeSection!=="about"} inert={sectionInert("about")} aria-label={t.nav[0]}>
      <div className="page-body">
        <h1 className="page-h">{t.about}</h1>
        <div className="about-lead">{settingsText("about_lead")}</div>
        <div className="long-copy">{settingsText("about_body")}</div>
        {settingsText("availability")&&<span className="hand-note">{settingsText("availability")}</span>}
        {d.skills.length>0&&<section className="about-section skills-section" aria-labelledby="skills-heading">
          <h2 className="about-section-title" id="skills-heading">{t.skills}</h2>
          <div className="matrix-card"><div className="matrix-groups">{d.skills.map(group=><div className="matrix-row" key={group.id}><div className="matrix-key">{localized(group,"group",locale)||group.group}</div><div className="matrix-val">{group.items?.join(", ")}</div></div>)}</div></div>
        </section>}
        <div className="about-cols">
          <section className="about-col" aria-labelledby="education-heading">
            <h2 className="about-section-title" id="education-heading">{t.education}</h2>
            {d.education.map(item=>{
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
            {d.certifications.map(cert=><div className="ab-item" key={cert.id}><div className="ab-main">{localized(cert,"name",locale)}{typeof cert.attachment_url==="string"&&cert.attachment_url?<a className="cert-link" href={assetUrl(cert.attachment_url)} target="_blank" rel="noreferrer">PDF ↗</a>:null}</div><div className="ab-sub">{cert.issuer} {cert.year}</div></div>)}
          </section>
        </div>
        {cvDocuments.length>0&&<section className="resume-cta" aria-labelledby="resume-heading">
          <div className="resume-copy"><h2 id="resume-heading">{t.library}</h2><p>{t.libraryNote}</p></div>
          <div className="resume-actions">{cvDocuments.map((document,index)=><a className={`resume-link${index===0?" is-primary":""}`} href={assetUrl(document.file_url)} target="_blank" rel="noreferrer" key={document.id}>{localized(document,"title",locale)} <span aria-hidden="true">↗</span></a>)}</div>
        </section>}
      </div>
      <button type="button" className="page-strip strip-about" onClick={()=>setActiveSection(null)} aria-label={`${t.back}: ${t.nav[0]}`}><span className="strip-monogram" aria-hidden="true">{initials[0]}</span><span className="strip-x"><svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg></span><span className="strip-label">{t.nav[0]}</span></button>
    </div>

    <div className={`page section-contact contact-page${activeSection==="contact"?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={activeSection!=="contact"} inert={sectionInert("contact")} aria-label={t.nav[3]}>
      <div className="page-body">
        <h1 className="page-h">{t.contact}</h1>
        <div className="contact-card">
          {settingsText("availability")&&<p className="ct-avail">{settingsText("availability")}</p>}
          {emailLink&&<a className="ct-email" href={emailLink.url}>{emailLink.url.replace(/^mailto:/,"")}</a>}
          <div className="ct-links">{otherLinks.map(link=><a className="ct-link" href={link.url} key={link.id} target={link.url.startsWith("http")?"_blank":undefined} rel="noreferrer"><span className="ct-lbl">{localized(link,"label",locale)||link.label}</span><span>{link.url.replace(/^https?:\/\//,"")}</span><span aria-hidden="true">↗</span></a>)}</div>
        </div>
      </div>
      <button type="button" className="page-strip strip-contact" onClick={()=>setActiveSection(null)} aria-label={`${t.back}: ${t.nav[3]}`}><span className="strip-monogram" aria-hidden="true">{initials[3]}</span><span className="strip-x"><svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg></span><span className="strip-label">{t.nav[3]}</span></button>
    </div>

    <AnimatePresence>
      {activeProject&&(()=>{
        const p=activeProject;
        const body=localized(p,"body",locale);
        const problem=localized(p,"problem",locale);
        const highlights=localizedList(p,"highlights",locale);
        const outcome=localized(p,"outcome",locale);
        const role=localized(p,"role",locale);
        return <motion.div className="proj-modal" role="dialog" aria-modal="true" aria-label={localized(p,"name",locale)} initial={reduce?{opacity:0}:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.2}} onClick={()=>setActiveProject(null)}>
          <motion.div className="proj-modal-card" onClick={event=>event.stopPropagation()} initial={reduce?{opacity:0}:{opacity:0,y:24,scale:.98}} animate={reduce?{opacity:1}:{opacity:1,y:0,scale:1}} exit={reduce?{opacity:0}:{opacity:0,y:16,scale:.98}} transition={{duration:.3,ease:[0.22,1,0.36,1]}}>
            <button type="button" ref={modalCloseRef} className="proj-modal-close" onClick={()=>setActiveProject(null)} aria-label={t.close}><svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>
            <div className="proj-modal-meta">{[p.category,p.employer,p.year].filter(Boolean).join(" · ")}</div>
            <h2 className="proj-modal-title">{localized(p,"name",locale)}</h2>
            {role&&<p className="proj-modal-role"><span className="proj-modal-k">{t.role}</span>{role}</p>}
            <p className="proj-modal-desc">{localized(p,"description",locale)}</p>
            {problem&&<div className="proj-modal-block"><div className="proj-modal-k">{t.problem}</div><p>{problem}</p></div>}
            {body&&<div className="proj-modal-block"><div className="proj-modal-k">{t.overview}</div><p>{body}</p></div>}
            {highlights.length>0&&<div className="proj-modal-block"><div className="proj-modal-k">{t.highlights}</div><ul className="proj-modal-highlights">{highlights.map((item,index)=><li key={`${index}-${item}`}>{item}</li>)}</ul></div>}
            {outcome&&<div className="proj-modal-block proj-modal-outcome"><div className="proj-modal-k">{t.outcome}</div><p>{outcome}</p></div>}
            {p.tech_stack&&p.tech_stack.length>0&&<div className="proj-modal-block"><div className="proj-modal-k">{t.stack}</div><div className="proj-tags">{p.tech_stack.map(tag=><span className="ptag" key={tag}>{tag}</span>)}</div></div>}
            {(p.live_url||p.github_url)&&<div className="proj-modal-actions">
              {p.live_url&&<a className="proj-modal-visit" href={p.live_url} target="_blank" rel="noreferrer"><span aria-hidden="true">◎</span>{t.visit} ↗</a>}
              {p.github_url&&<a className="proj-modal-visit proj-modal-source" href={p.github_url} target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.88c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.55 9.55 0 0 1 12 6.82a9.5 9.5 0 0 1 2.5.34c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>{t.source}</a>}
            </div>}
          </motion.div>
        </motion.div>;
      })()}
    </AnimatePresence>
  </main>
}
