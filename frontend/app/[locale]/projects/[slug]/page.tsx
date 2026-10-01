import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getPortfolio,getProject} from "@/lib/api";
import type {Project} from "@/lib/types";
import {localeAlternates,projectJsonLd,seoSiteUrl} from "@/lib/seo";
import {safeExternalUrl} from "@/components/portfolio/copy";

export const dynamic="force-dynamic";
type Locale="tr"|"en";
type PageProps={params:Promise<{locale:string;slug:string}>};
const siteUrl=seoSiteUrl();
const labels={
  tr:{back:"Portfolyoya dön",problem:"Problem / ihtiyaç",role:"Üstlendiğim rol",solution:"Geliştirdiğim çözüm",highlights:"Öne çıkanlar",outcome:"Sonuç ve etki",stack:"Teknolojiler",live:"Canlı ürünü görüntüle",github:"GitHub’da incele",other:"Diğer projeler",fallback:"Bu alan için Türkçe içerik bulunmadığından İngilizce karşılığı gösteriliyor."},
  en:{back:"Back to portfolio",problem:"Problem / need",role:"My role",solution:"Solution delivered",highlights:"Highlights",outcome:"Outcome and impact",stack:"Technologies",live:"View live product",github:"View on GitHub",other:"Other projects",fallback:"The English translation is not available for this field, so the Turkish version is shown."}
} as const;
const fields=["name","description","problem","role","body","highlights","outcome"] as const;

function localized(project:Project,key:typeof fields[number],locale:Locale){
  const primary=project[`${key}_${locale}`];
  const alternate=project[`${key}_${locale==="tr"?"en":"tr"}`];
  const legacy=project[key];
  return String(primary||alternate||legacy||"");
}
function localizedList(project:Project,key:"highlights",locale:Locale){
  const value=project[`${key}_${locale}`]||project[`${key}_${locale==="tr"?"en":"tr"}`]||project[key];
  if(Array.isArray(value))return value.map(String).filter(Boolean);
  return String(value||"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
}
function usesFallback(project:Project,locale:Locale){return fields.some(key=>!project[`${key}_${locale}`]&&Boolean(project[`${key}_${locale==="tr"?"en":"tr"}`]))}

export async function generateMetadata({params}:PageProps):Promise<Metadata>{
  const {locale:rawLocale,slug}=await params;if(rawLocale!=="tr"&&rawLocale!=="en")return {};
  const locale=rawLocale as Locale;const project=await getProject(slug);if(!project)return {};
  const title=`${localized(project,"name",locale)} — Gökçe Güler`;
  const description=localized(project,"description",locale);
  const path=`/${locale}/projects/${project.slug}`;
  return {metadataBase:new URL(siteUrl),title:{absolute:title},description,alternates:{canonical:path,languages:localeAlternates(`projects/${project.slug}`)},openGraph:{title,description,url:path,type:"article",locale:locale==="tr"?"tr_TR":"en_US",images:[{url:"/opengraph-image",width:1200,height:630,alt:title}]},twitter:{card:"summary_large_image",title,description,images:["/opengraph-image"]}};
}

export default async function ProjectDetailPage({params}:PageProps){
  const {locale:rawLocale,slug}=await params;if(rawLocale!=="tr"&&rawLocale!=="en")notFound();const locale=rawLocale as Locale;
  const [project,portfolio]=await Promise.all([getProject(slug),getPortfolio()]);if(!project)notFound();
  const t=labels[locale];const projects=(portfolio?.projects||[]).filter(item=>item.slug!==project.slug).slice(0,3);const highlights=localizedList(project,"highlights",locale);
  const liveUrl=safeExternalUrl(project.live_url);const githubUrl=safeExternalUrl(project.github_url);
  const blocks=[{key:"problem",label:t.problem},{key:"role",label:t.role},{key:"body",label:t.solution},{key:"outcome",label:t.outcome}] as const;
  const jsonLd=projectJsonLd(project,locale);
  return <main className="project-detail-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>
    <header className="project-detail-top"><Link href={`/${locale}`} className="project-home-link">← {t.back}</Link><nav aria-label="Language"><Link className={locale==="tr"?"active":""} href={`/tr/projects/${project.slug}`}>TR</Link><span>/</span><Link className={locale==="en"?"active":""} href={`/en/projects/${project.slug}`}>EN</Link></nav></header>
    <article className="project-detail-shell">
      <div className="project-detail-hero"><p className="project-detail-meta">{[project.category,project.employer,project.year].filter(Boolean).join(" · ")}</p><h1>{localized(project,"name",locale)}</h1><p className="project-detail-intro">{localized(project,"description",locale)}</p>{usesFallback(project,locale)&&<p className="project-fallback-note">{t.fallback}</p>}</div>
      <div className="project-detail-content">
        {blocks.map(block=>localized(project,block.key,locale)&&<section key={block.key}><h2>{block.label}</h2><p>{localized(project,block.key,locale)}</p></section>)}
        {highlights.length>0&&<section><h2>{t.highlights}</h2><ul>{highlights.map((item,index)=><li key={`${index}-${item}`}>{item}</li>)}</ul></section>}
        {project.tech_stack&&project.tech_stack.length>0&&<section><h2>{t.stack}</h2><div className="project-detail-tech">{project.tech_stack.map(tech=><span key={tech}>{tech}</span>)}</div></section>}
        {(liveUrl||githubUrl)&&<div className="project-detail-actions">{liveUrl&&<a href={liveUrl} target="_blank" rel="noreferrer">{t.live} ↗</a>}{githubUrl&&<a href={githubUrl} target="_blank" rel="noreferrer">{t.github} ↗</a>}</div>}
      </div>
    </article>
    {projects.length>0&&<aside className="project-related" aria-labelledby="related-title"><h2 id="related-title">{t.other}</h2><div>{projects.map(item=><Link href={`/${locale}/projects/${item.slug}`} key={item.id}><strong>{localized(item,"name",locale)}</strong><span>{localized(item,"description",locale)}</span><b aria-hidden="true">→</b></Link>)}</div></aside>}
  </main>;
}
