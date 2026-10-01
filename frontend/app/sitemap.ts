import type {MetadataRoute} from "next";
import {getPortfolio} from "@/lib/api";

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").replace(/\/$/,"");
  const data=await getPortfolio();const now=new Date();
  const pages:MetadataRoute.Sitemap=["tr","en"].map(locale=>({url:`${base}/${locale}`,lastModified:now,changeFrequency:"monthly",priority:1}));
  for(const project of data?.projects||[])for(const locale of ["tr","en"])pages.push({url:`${base}/${locale}/projects/${project.slug}`,lastModified:now,changeFrequency:"monthly",priority:.8});
  return pages;
}
