import type {MetadataRoute} from "next";
import {getPortfolio} from "@/lib/api";
import {seoSiteUrl,sitemapEntries} from "@/lib/seo";

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const data=await getPortfolio();const now=new Date();
  return sitemapEntries(data?.projects||[],seoSiteUrl()).map(entry=>({...entry,lastModified:now})) as MetadataRoute.Sitemap;
}
