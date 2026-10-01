import test from "node:test";
import assert from "node:assert/strict";
import {localeAlternates,profileJsonLd,projectJsonLd,robotsPolicy,seoWarnings,sitemapEntries} from "../lib/seo.ts";
import type {Project,Social} from "../lib/types.ts";

test("canonical language alternates include TR, EN and x-default",()=>{
  assert.deepEqual(localeAlternates("projects/ornek"),{tr:"/tr/projects/ornek",en:"/en/projects/ornek","x-default":"/tr/projects/ornek"});
});

test("robots explicitly allows OAI-SearchBot and configures GPTBot",()=>{
  assert.deepEqual(robotsPolicy(true).find(rule=>rule.userAgent==="OAI-SearchBot"),{userAgent:"OAI-SearchBot",allow:"/",disallow:"/admin"});
  assert.equal(robotsPolicy(false).find(rule=>rule.userAgent==="GPTBot")?.disallow,"/");
});

test("sitemap omits hidden projects",()=>{
  const projects=[{id:1,slug:"live",sort_order:1,visible:true},{id:2,slug:"draft",sort_order:2,visible:false}] as Project[];
  const urls=sitemapEntries(projects,"https://example.com").map(item=>item.url);
  assert.ok(urls.includes("https://example.com/tr/projects/live"));
  assert.ok(!urls.some(url=>url.includes("draft")));
});

test("JSON-LD exposes profile identities and software projects",()=>{
  const socials=[{id:1,slug:"github",sort_order:1,visible:true,url:"https://github.com/example"},{id:2,slug:"email",sort_order:2,visible:true,url:"mailto:test@example.com"}] as Social[];
  const profile=profileJsonLd("tr",{name:"Gökçe",title_tr:"Mühendis"},socials);
  assert.deepEqual(profile.mainEntity.sameAs,["https://github.com/example"]);
  const project=projectJsonLd({id:1,slug:"app",sort_order:1,visible:true,name_tr:"Uygulama",description_tr:"Açıklama",live_url:"https://example.com"},"tr");
  assert.equal(project["@type"],"SoftwareApplication");
});

test("SEO length rules flag missing and oversized values",()=>{
  assert.ok(seoWarnings("","x").title);
  assert.ok(seoWarnings("x".repeat(61),"x".repeat(161)).description);
});
