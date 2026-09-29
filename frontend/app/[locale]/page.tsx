import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getPortfolio} from "@/lib/api";
import Portfolio from "@/components/portfolio";
export const dynamic="force-dynamic";

const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";
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
  const title=role?`${name} — ${role}`:fallback[locale].title;
  const description=pick("tagline")||pick("about_lead")||fallback[locale].description;
  return {
    metadataBase:new URL(siteUrl),
    title,
    description,
    alternates:{canonical:`/${locale}`,languages:{tr:"/tr",en:"/en","x-default":"/tr"}},
    openGraph:{title,description,url:`/${locale}`,siteName:name,locale:locale==="tr"?"tr_TR":"en_US",type:"website"},
    twitter:{card:"summary_large_image",title,description},
    icons:{icon:"/brand/ggu.png"}
  };
}

export default async function LocalizedPage({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(locale!=="tr"&&locale!=="en")notFound();
  return <Portfolio initialData={await getPortfolio()} locale={locale}/>;
}
