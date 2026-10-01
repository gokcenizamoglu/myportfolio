"use client";
import {seoWarnings} from "@/lib/seo";

export default function SeoPreview({title,description,canonical,indexable,inSitemap}:{title:string;description:string;canonical:string;indexable:boolean;inSitemap:boolean}){
  const warnings=seoWarnings(title,description);
  return <section className="admin-seo-preview full" aria-labelledby="seo-preview-title">
    <div className="admin-seo-head"><div><span>Teknik SEO</span><h2 id="seo-preview-title">Google sonuç önizlemesi</h2></div><div className="admin-seo-states"><span className={indexable?"ok":"bad"}>{indexable?"İndekslenebilir":"Noindex / gizli"}</span><span className={inSitemap?"ok":"muted"}>{inSitemap?"Sitemap’e dahil":"Sitemap dışında"}</span></div></div>
    <div className="google-preview"><small>{canonical}</small><strong>{title||"SEO başlığı burada görünecek"}</strong><p>{description||"Meta açıklaması burada görünecek."}</p></div>
    <div className="admin-seo-meta"><div><b>Başlık</b><span>{title.length}/60</span>{warnings.title&&<em>{warnings.title}</em>}</div><div><b>Açıklama</b><span>{description.length}/160</span>{warnings.description&&<em>{warnings.description}</em>}</div><div className="canonical-row"><b>Canonical</b><code>{canonical}</code></div></div>
  </section>;
}
