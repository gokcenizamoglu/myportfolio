"use client";

import {useEffect,useMemo,useState} from "react";
import type {CSSProperties} from "react";
import {HealthIssue,HealthReport,healthStatus} from "@/lib/content-health";

type Totals={unique_visitors:number;page_views:number;section_views:number;project_views:number;cv_downloads:number};
type Daily=Totals&{date:string};
type Summary={period_days:number;start_date:string;end_date:string;totals:Totals;daily:Daily[];top_projects:{slug:string;views:number}[];locales:{locale:string;views:number}[]};

const metricLabels:[keyof Totals,string][]=[
  ["unique_visitors","Tekil ziyaretçi"],
  ["page_views","Sayfa görüntüleme"],
  ["project_views","Proje görüntüleme"],
  ["cv_downloads","CV indirme"],
];

export default function AnalyticsDashboard({request,onOpenIssue}:{request:<T=unknown>(path:string,init?:RequestInit)=>Promise<T>;onOpenIssue:(issue:HealthIssue)=>void}){
  const [days,setDays]=useState<7|30>(30);
  const [summary,setSummary]=useState<Summary|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [health,setHealth]=useState<HealthReport|null>(null);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    setError("");
    Promise.all([request<Summary>(`/api/v1/admin/analytics?days=${days}`),request<HealthReport>("/api/v1/admin/content/health")])
      .then(([analytics,healthReport])=>{if(active){setSummary(analytics);setHealth(healthReport)}})
      .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Analytics verileri yüklenemedi.")})
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[days,request]);

  const maxViews=useMemo(()=>Math.max(1,...(summary?.daily.map(day=>day.page_views)||[])),[summary]);
  const totalLocaleViews=useMemo(()=>summary?.locales.reduce((sum,item)=>sum+item.views,0)||0,[summary]);
  const isEmpty=summary?Object.values(summary.totals).every(value=>value===0):false;

  return <div className="analytics-dashboard">
    <div className="toolbar analytics-heading">
      <div><p className="admin-eyebrow">Genel bakış</p><h1>Analytics</h1><p>Portfolyonun first-party ve gizlilik odaklı kullanım özeti.</p></div>
      <div className="analytics-range" aria-label="Tarih aralığı">
        <button className={days===7?"active":""} onClick={()=>setDays(7)}>7 gün</button>
        <button className={days===30?"active":""} onClick={()=>setDays(30)}>30 gün</button>
      </div>
    </div>
    {error&&<div className="error analytics-error">{error}</div>}
    {loading&&!summary?<div className="analytics-loading">Analytics verileri yükleniyor…</div>:summary&&<>
      <section className="analytics-metrics" aria-label="Temel metrikler">
        {metricLabels.map(([key,label],index)=><article className={`analytics-metric metric-${index+1}`} key={key}>
          <span>{label}</span><strong>{summary.totals[key].toLocaleString("tr-TR")}</strong><small>Son {days} gün</small>
        </article>)}
      </section>
      {isEmpty&&<div className="analytics-empty-note"><strong>Henüz production verisi yok.</strong><span>Localhost ve bot trafiği gizlilik kuralları gereği sayılmaz.</span></div>}
      {health&&<section className="health-overview">
        <article className="health-score-card"><div className="health-score-ring" style={{"--score":`${health.score*3.6}deg`} as CSSProperties}><strong>{health.score}</strong><span>/ 100</span></div><div><span>İçerik sağlık puanı</span><h2>{healthStatus(health.score)}</h2><p>{health.critical_count} kritik, {health.issue_count-health.critical_count} iyileştirme önerisi</p></div></article>
        <article className="health-distribution"><div className="analytics-card-title"><div><span>Dağılım</span><h2>İçerik türüne göre sorunlar</h2></div><strong>{health.issue_count}</strong></div><div>{Object.entries(health.by_kind).sort((a,b)=>b[1]-a[1]).map(([kind,count])=><span key={kind}><b>{kind}</b><i>{count}</i></span>)}</div></article>
      </section>}
      <section className="analytics-grid">
        <article className="analytics-card analytics-chart-card">
          <div className="analytics-card-title"><div><span>Trafik</span><h2>Günlük sayfa görüntüleme</h2></div><strong>{summary.totals.page_views}</strong></div>
          <div className="analytics-chart" role="img" aria-label={`Son ${days} günlük sayfa görüntüleme grafiği`}>
            {summary.daily.map((day,index)=><div className="analytics-day" key={day.date} title={`${day.date}: ${day.page_views}`}>
              <div className="analytics-bar-track"><i style={{height:`${Math.max(day.page_views?8:2,day.page_views/maxViews*100)}%`}}/></div>
              {(days===7||index%5===0||index===summary.daily.length-1)&&<time dateTime={day.date}>{new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"short"}).format(new Date(`${day.date}T12:00:00Z`))}</time>}
            </div>)}
          </div>
          <div className="analytics-chart-legend"><span><i/> Sayfa görüntüleme</span><span>{summary.start_date} — {summary.end_date}</span></div>
        </article>
        <article className="analytics-card analytics-breakdown">
          <div className="analytics-card-title"><div><span>Dil dağılımı</span><h2>Ziyaretlerin dili</h2></div></div>
          <div className="locale-list">
            {summary.locales.length?summary.locales.map(item=>{
              const percent=totalLocaleViews?Math.round(item.views/totalLocaleViews*100):0;
              return <div className="locale-row" key={item.locale}><div><strong>{item.locale.toUpperCase()}</strong><span>{item.views} görüntüleme</span></div><div className="locale-progress"><i style={{width:`${percent}%`}}/></div><b>{percent}%</b></div>
            }):<p className="analytics-no-data">Dil verisi bulunmuyor.</p>}
          </div>
          <div className="analytics-secondary-metric"><span>Bölüm görüntüleme</span><strong>{summary.totals.section_views}</strong></div>
        </article>
        <article className="analytics-card analytics-projects">
          <div className="analytics-card-title"><div><span>Projeler</span><h2>En çok görüntülenenler</h2></div></div>
          {summary.top_projects.length?<ol>{summary.top_projects.map((project,index)=><li key={project.slug}><span>{String(index+1).padStart(2,"0")}</span><strong>{project.slug.replaceAll("-"," ")}</strong><b>{project.views}</b></li>)}</ol>:<p className="analytics-no-data">Henüz proje görüntülemesi bulunmuyor.</p>}
        </article>
      </section>
      {health&&<section className="analytics-card health-todo"><div className="analytics-card-title"><div><span>İçerik sağlığı</span><h2>Tamamlanması gerekenler</h2></div><strong>{health.issue_count}</strong></div>{health.issues.length?<div className="health-issue-list">{health.issues.map((issue,index)=><button key={`${issue.kind}-${issue.id||0}-${issue.code}-${issue.field}-${index}`} onClick={()=>onOpenIssue(issue)}><i className={issue.severity}/><span><strong>{issue.slug||issue.kind}</strong><small>{issue.message}{issue.locale?` · ${issue.locale.toUpperCase()}`:""}</small></span><b>Düzenle →</b></button>)}</div>:<p className="analytics-no-data">Tüm içerikler tamamlandı.</p>}</section>}
    </>}
  </div>;
}
