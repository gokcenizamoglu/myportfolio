import type {MetadataRoute} from "next";
import {robotsPolicy,seoSiteUrl} from "@/lib/seo";
export const dynamic="force-dynamic";

export default function robots():MetadataRoute.Robots{
  return {rules:robotsPolicy(),sitemap:`${seoSiteUrl()}/sitemap.xml`,host:seoSiteUrl()};
}
