import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getPortfolio} from "@/lib/api";
import Portfolio from "@/components/portfolio";
import {localeAlternates,profileJsonLd,seoSiteUrl} from "@/lib/seo";
export const dynamic="force-dynamic";

const siteUrl=seoSiteUrl();
const fallback={
  tr:{title:"Gökçe Güler — Full-Stack Yazılım Mühendisi",description:"Mimariden production'a yazılım sistemleri tasarlıyor ve geliştiriyorum."},
  en:{title:"Gökçe Güler — Full-Stack Software Engineer",description:"Software systems from architecture to production."}
} as const;

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale}=await params;
  if(locale!=="tr"&&locale!=="en")return {};
  const data=await getPortfolio();
  const s=data?.settings??{};
  const pick=(key:string)=>s[`${key}_${locale}`]||s[key]||"";
  const name=pick("name")||"Gökçe Güler";
  const role=pick("title");
  const seoTitle=pick("seo_title");
  const title=seoTitle||(role?`${name} — ${role}`:fallback[locale].title);
  const description=pick("seo_description")||pick("tagline")||pick("about_lead")||fallback[locale].description;
  return {
    metadataBase:new URL(siteUrl),
    title:{absolute:title},
    description,
    alternates:{canonical:`/${locale}`,languages:localeAlternates()},
    openGraph:{title,description,url:`/${locale}`,siteName:name,locale:locale==="tr"?"tr_TR":"en_US",type:"website",images:[{url:"/opengraph-image",width:1200,height:630,alt:title}]},
    twitter:{card:"summary_large_image",title,description,images:["/opengraph-image"]}
  };
}

export default async function LocalizedPage({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(locale!=="tr"&&locale!=="en")notFound();
  const data=await getPortfolio();const jsonLd=profileJsonLd(locale,data?.settings||{},data?.socials||[]);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><Portfolio initialData={data} locale={locale}/></>;
}
