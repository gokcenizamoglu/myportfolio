import type { Metadata } from "next";
import { headers } from "next/headers";
import { Raleway, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import {seoSiteUrl} from "@/lib/seo";

const raleway = Raleway({ subsets: ["latin", "latin-ext"], variable: "--font-raleway" });
const sourceSans = Source_Sans_3({ subsets: ["latin", "latin-ext"], variable: "--font-source-sans" });

export const metadata:Metadata={metadataBase:new URL(seoSiteUrl()),applicationName:"Gökçe Güler",title:{default:"Gökçe Güler — Full-Stack Software Engineer",template:"%s — Gökçe Güler"},description:"Software systems from architecture to production.",icons:{icon:[{url:"/brand/ggu.png",type:"image/png"}],apple:"/brand/ggu.png"},openGraph:{siteName:"Gökçe Güler",images:[{url:"/opengraph-image",width:1200,height:630,alt:"Gökçe Güler — Full-Stack Software Engineer"}]},twitter:{card:"summary_large_image",images:["/opengraph-image"]}};

// The locale lives in the URL (/tr, /en), so derive the document language from
// the pathname that middleware forwards. Reading request headers makes this
// root layout request-rendered; that trade-off is deliberate because the public
// portfolio already fetches uncached CMS data on every request, while it keeps
// the first HTML response accessible without duplicating the route tree into
// separate root-layout groups.
export default async function RootLayout({children}:{children:React.ReactNode}){
  const pathname=(await headers()).get("x-pathname")||"";
  const lang=pathname.startsWith("/en")?"en":"tr";
  return <html lang={lang}><body className={`${raleway.variable} ${sourceSans.variable}`}>{children}</body></html>;
}
