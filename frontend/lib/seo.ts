import type {Project,Social} from "./types";

export type SeoLocale="tr"|"en";
export const SITE_NAME="Gökçe Güler";
export const DEFAULT_SITE_URL="http://localhost:3000";
export const seoSiteUrl=()=>String(process.env.NEXT_PUBLIC_SITE_URL||DEFAULT_SITE_URL).replace(/\/$/,"");

export function localeAlternates(path=""){
  const suffix=path?`/${path.replace(/^\//,"")}`:"";
  return {tr:`/tr${suffix}`,en:`/en${suffix}`,"x-default":`/tr${suffix}`};
}

export function seoWarnings(title:string,description:string){
  return {
    title:title.length===0?"Başlık eksik.":title.length<30?"Başlık kısa; 30–60 karakter hedefleyin.":title.length>60?"Başlık uzun; arama sonucunda kesilebilir.":"",
    description:description.length===0?"Meta açıklaması eksik.":description.length<70?"Açıklama kısa; 70–160 karakter hedefleyin.":description.length>160?"Açıklama uzun; arama sonucunda kesilebilir.":"",
  };
}

export function robotsPolicy(allowGPTBot=process.env.GPTBOT_ALLOW!=="false"){
  return [
    {userAgent:"*",allow:"/",disallow:"/admin"},
    {userAgent:"OAI-SearchBot",allow:"/",disallow:"/admin"},
    {userAgent:"GPTBot",allow:allowGPTBot?"/":undefined,disallow:allowGPTBot?"/admin":"/"},
  ];
}

export function projectJsonLd(project:Project,locale:SeoLocale){
  const pick=(key:string)=>String(project[`${key}_${locale}`]||project[`${key}_${locale==="tr"?"en":"tr"}`]||project[key]||"");
  const base=seoSiteUrl();
  return {"@context":"https://schema.org","@type":project.live_url?"SoftwareApplication":"CreativeWork",name:pick("name"),description:pick("description"),url:`${base}/${locale}/projects/${project.slug}`,creator:{"@type":"Person",name:SITE_NAME,url:base},applicationCategory:project.category||undefined,softwareRequirements:project.tech_stack?.join(", ")||undefined,sameAs:[project.live_url,project.github_url].filter(Boolean)};
}

export function profileJsonLd(locale:SeoLocale,settings:Record<string,string>,socials:Social[]){
  const base=seoSiteUrl();const pick=(key:string)=>settings[`${key}_${locale}`]||settings[key]||"";
  const sameAs=socials.map(item=>item.url).filter(url=>/^https?:\/\/(?:www\.)?(github\.com|linkedin\.com)\//i.test(url));
  const person={"@type":"Person",name:settings.name||SITE_NAME,url:`${base}/${locale}`,jobTitle:pick("title"),description:pick("about_lead")||pick("tagline"),sameAs};
  return {"@context":"https://schema.org","@type":"ProfilePage",url:`${base}/${locale}`,inLanguage:locale,mainEntity:person};
}

export function sitemapEntries(projects:Project[],base=seoSiteUrl()){
  const entries=["tr","en"].map(locale=>({url:`${base}/${locale}`,changeFrequency:"monthly" as const,priority:1}));
  for(const project of projects.filter(item=>item.visible!==false))for(const locale of ["tr","en"])entries.push({url:`${base}/${locale}/projects/${project.slug}`,changeFrequency:"monthly" as const,priority:.8});
  return entries;
}
