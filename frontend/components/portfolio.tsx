"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {apiBase} from "@/lib/api";
import type {PortfolioData} from "@/lib/types";

type Locale="tr"|"en";
type Section="about"|"experience"|"work"|"contact";
const copy={
  tr:{nav:["Hakkımda","Deneyim","Projeler","İletişim"],about:"Teknik yaklaşımım",work:"Geliştirdiğim seçkin sistemler",workNote:"Karmaşık iş akışlarını sade, güvenilir ürünlere dönüştürdüğüm bazı çalışmalar.",experience:"Mühendislik deneyimlerim",education:"Eğitim",skills:"Teknik araç kutum",certs:"Sertifikalar",library:"Ekler",libraryNote:"CV’lerimi, sertifikalarımı ve paylaşmak istediğim diğer belgeleri buradan inceleyebilirsin.",contact:"Gelin birlikte tasarlayalım",open:"Aç / indir",close:"Kapat",present:"Şu an",current:"Devam ediyor",apiOffline:"Portfolyo API’sine ulaşılamıyor.",apiHelp:"Go API’yi başlatınca içerikler burada görünecek."},
  en:{nav:["About","Experience","Projects","Contact"],about:"My technical approach",work:"Selected systems I've built",workNote:"A few systems where I turned complicated operations into calm, dependable products.",experience:"Engineering experience",education:"Education",skills:"My toolbox",certs:"Certifications",library:"Downloads",libraryNote:"My résumés, certificates and other useful documents live here.",contact:"Let's build something together",open:"Open / download",close:"Close",present:"Present",current:"In progress",apiOffline:"The portfolio API is offline.",apiHelp:"Start the Go API and the content will appear here."}
};

function localized(item:Record<string,unknown>,key:string,locale:Locale){return String(item[`${key}_${locale}`]??item[key]??"")}
function assetUrl(value?:string){if(!value)return "";if(value.startsWith("/uploads/"))return `${apiBase}${value}`;return value}
function TileIcon({kind}:{kind:Section}){const paths:Record<Section,string>={about:"M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 16.9 5.8 20.3l1.6-6.8L2.2 8.9l6.9-.6L12 2Z",experience:"M4 7h16v12H4zM9 7V4h6v3",work:"M12 21s-7-4.4-7-11a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 6.6-7 11-7 11Z",contact:"M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"};return <svg className="pnl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>}

export default function Portfolio({initialData,locale}:{initialData:PortfolioData|null;locale:Locale}){
  const t=copy[locale];
  const [activeSection,setActiveSection]=useState<Section|null>(null);
  useEffect(()=>{document.body.style.overflow=activeSection?"hidden":"";const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setActiveSection(null)};window.addEventListener("keydown",close);return()=>{document.body.style.overflow="";window.removeEventListener("keydown",close)}},[activeSection]);
  if(!initialData)return <main className="offline"><img src="/brand/ggu.png" alt=""/><h1>{t.apiOffline}</h1><p>{t.apiHelp}</p></main>;
  const d=initialData,s=d.settings;
  const settingsText=(key:string)=>s[`${key}_${locale}`]||s[key]||"";
  const nameLogo=assetUrl(s.logo_wordmark_url)||"/brand/ggu.png";
  const tiles:{kind:Section;label:string}[]=[
    {kind:"about",label:t.nav[0]},
    {kind:"experience",label:t.nav[1]},
    {kind:"work",label:t.nav[2]},
    {kind:"contact",label:t.nav[3]},
  ];
  const projects=d.projects||[];
  const emailLink=d.socials.find(link=>link.url.startsWith("mailto:"));
  const otherLinks=d.socials.filter(link=>link!==emailLink);

  return <main className="gg-shell" data-open={activeSection?"true":"false"}>
    <nav className="gg-lang" aria-label="Language"><Link className={locale==="tr"?"active":""} href="/tr">TR</Link><span>/</span><Link className={locale==="en"?"active":""} href="/en">EN</Link></nav>

    <div className="gg-base">
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

    <nav className="gg-grid" aria-label="Portfolio sections">
      {tiles.map(tile=><button type="button" className={`pnl pnl-${tile.kind}`} onClick={()=>setActiveSection(tile.kind)} key={tile.kind}><TileIcon kind={tile.kind}/><span className="pnl-title">{tile.label}</span></button>)}
    </nav>

    <div className={`page section-work${activeSection==="work"?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={activeSection!=="work"} aria-label={t.nav[2]}>
      <div className="page-body">
        <h1 className="page-h">{t.work}</h1>
        <div className="page-sub">{t.workNote}</div>
        <div className="work-grid">
          {projects.map((project,index)=><div className="proj-card" key={project.id}>
            <div className="proj-tag">{String(index+1).padStart(2,"0")}</div>
            <div className="proj-name">{localized(project,"name",locale)}</div>
            <div className="proj-desc">{localized(project,"description",locale)}</div>
            <div className="proj-meta">{[project.category,project.employer,project.year].filter(Boolean).join(" · ")}</div>
            <div className="proj-tags">{project.tech_stack?.map(tag=><span className="ptag" key={tag}>{tag}</span>)}</div>
          </div>)}
        </div>
      </div>
      <button type="button" className="page-strip strip-work" onClick={()=>setActiveSection(null)} aria-label={t.close}><span className="strip-x"><svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg></span><span className="strip-label">{t.nav[2]}</span></button>
    </div>

    <div className={`page section-experience${activeSection==="experience"?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={activeSection!=="experience"} aria-label={t.nav[1]}>
      <div className="page-body">
        <h1 className="page-h">{t.experience}</h1>
        {d.experiences.map(item=>{
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
        })}
      </div>
      <button type="button" className="page-strip strip-experience" onClick={()=>setActiveSection(null)} aria-label={t.close}><span className="strip-x"><svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg></span><span className="strip-label">{t.nav[1]}</span></button>
    </div>

    <div className={`page section-about${activeSection==="about"?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={activeSection!=="about"} aria-label={t.nav[0]}>
      <div className="page-body">
        <h1 className="page-h">{t.about}</h1>
        <div className="about-lead">{settingsText("about_lead")}</div>
        <div className="long-copy">{settingsText("about_body")}</div>
        {settingsText("availability")&&<span className="hand-note">{settingsText("availability")}</span>}
        {d.skills.length>0&&<div className="matrix-card">
          <div className="matrix-label">{t.skills}</div>
          {d.skills.map(group=><div className="matrix-row" key={group.id}><div className="matrix-key">{localized(group,"group",locale)||group.group}</div><div className="matrix-val">{group.items?.join(", ")}</div></div>)}
        </div>}
        <div className="about-cols">
          <div>
            <div className="ab-h">{t.education}</div>
            {d.education.map(item=><div className="ab-item" key={item.id}><div className="ab-main">{localized(item,"school",locale)}</div><div className="ab-sub">{localized(item,"degree",locale)} · {item.end_date}</div></div>)}
          </div>
          <div>
            <div className="ab-h">{t.certs}</div>
            {d.certifications.map(cert=><div className="ab-item" key={cert.id}><div className="ab-main">{localized(cert,"name",locale)}{typeof cert.attachment_url==="string"&&cert.attachment_url?<a href={assetUrl(cert.attachment_url)} target="_blank" rel="noreferrer" style={{marginLeft:8,color:"var(--navy)",fontSize:11}}>PDF ↗</a>:null}</div><div className="ab-sub">{cert.issuer} {cert.year}</div></div>)}
          </div>
        </div>
        {(d.documents&&d.documents.length>0)&&<div className="panel-subsection">
          <div className="ab-h">{t.library}</div>
          <p className="long-copy" style={{marginTop:8}}>{t.libraryNote}</p>
          <div className="document-grid">{d.documents.map(document=><a className="document-card" href={assetUrl(document.file_url)} target="_blank" rel="noreferrer" key={document.id}><span className="file-type">{document.category?.toUpperCase()||"PDF"}</span><h3>{localized(document,"title",locale)}</h3><p>{localized(document,"description",locale)}</p><strong>{t.open} ↗</strong></a>)}</div>
        </div>}
      </div>
      <button type="button" className="page-strip strip-about" onClick={()=>setActiveSection(null)} aria-label={t.close}><span className="strip-x"><svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg></span><span className="strip-label">{t.nav[0]}</span></button>
    </div>

    <div className={`page section-contact contact-page${activeSection==="contact"?" is-active":""}`} role="dialog" aria-modal="true" aria-hidden={activeSection!=="contact"} aria-label={t.nav[3]}>
      <div className="page-body">
        <div className="ct-hero">{t.contact}</div>
        {settingsText("availability")&&<p className="ct-avail">{settingsText("availability")}</p>}
        {emailLink&&<a className="ct-email" href={emailLink.url}>{emailLink.url.replace(/^mailto:/,"")}</a>}
        <div className="ct-links">{otherLinks.map(link=><a className="ct-link" href={link.url} key={link.id} target={link.url.startsWith("http")?"_blank":undefined} rel="noreferrer"><span className="ct-lbl">{localized(link,"label",locale)||link.label}</span>{link.url.replace(/^https?:\/\//,"")}</a>)}</div>
      </div>
      <button type="button" className="page-strip strip-contact" onClick={()=>setActiveSection(null)} aria-label={t.close}><span className="strip-x"><svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg></span><span className="strip-label">{t.nav[3]}</span></button>
    </div>
  </main>
}
