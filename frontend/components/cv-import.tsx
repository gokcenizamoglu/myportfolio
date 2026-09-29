"use client";
import {useState} from "react";
import {apiBase} from "@/lib/api";

type ApiRequest=(path:string,init?:RequestInit)=>Promise<any>;
type FieldDiff={field:string;old:string;new:string;auto_translated:boolean;changed:boolean};
type Change={kind:string;action:"create"|"update";matched_id?:number;slug:string;data:Record<string,unknown>;field_diffs:FieldDiff[]};
type Orphan={kind:string;id:number;slug:string;label:string};
type Draft={changes:Change[];orphans:Orphan[]};
const kindLabel:Record<string,string>={experiences:"Deneyim",education:"Eğitim",certifications:"Sertifikalar",skills:"Yetenekler",projects:"Projeler"};

export default function CvImport({request}:{request:ApiRequest}){
  const [lang,setLang]=useState<"tr"|"en">("tr");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [draft,setDraft]=useState<Draft|null>(null);

  async function onFile(file:File){
    setError("");setLoading(true);setDraft(null);
    try{
      const form=new FormData();form.append("file",file);form.append("lang",lang);
      const response=await fetch(`${apiBase}/api/v1/admin/cv/import`,{method:"POST",body:form,credentials:"include"});
      if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.error||"İçe aktarma başarısız")}
      setDraft(await response.json());
    }catch(e){setError((e as Error).message)}finally{setLoading(false)}
  }

  return <div>
    <div className="toolbar"><h1>CV içe aktar</h1></div>
    {error&&<div className="error" style={{marginBottom:16}}>{error}</div>}
    <div className="cv-upload">
      <label>CV dili
        <select value={lang} onChange={e=>setLang(e.target.value as "tr"|"en")}><option value="tr">Türkçe</option><option value="en">English</option></select>
      </label>
      <input type="file" accept=".pdf" disabled={loading} onChange={e=>{const f=e.target.files?.[0];if(f)onFile(f)}}/>
      {loading&&<small>Gemini CV’yi okuyor…</small>}
      <p className="cv-hint">PDF yüklersin, Gemini içeriği çıkarır; hiçbir şey sen onaylamadan kaydedilmez.</p>
    </div>
    {draft&&<CvReview draft={draft} lang={lang} request={request}/>}
  </div>;
}

type Decision="accept"|"skip";

function CvReview({draft,lang,request}:{draft:Draft;lang:"tr"|"en";request:ApiRequest}){
  const [decisions,setDecisions]=useState<Record<number,Decision>>(()=>Object.fromEntries(draft.changes.map((_,i)=>[i,"accept"])));
  const [edits,setEdits]=useState<Record<number,Record<string,string>>>({});
  const [applying,setApplying]=useState(false);
  const [result,setResult]=useState("");
  const [error,setError]=useState("");

  function setEdit(index:number,field:string,value:string){setEdits(prev=>({...prev,[index]:{...prev[index],[field]:value}}))}
  function valueFor(change:Change,index:number,diff:FieldDiff){return edits[index]?.[diff.field]??diff.new}

  async function apply(){
    setApplying(true);setError("");setResult("");
    let created=0,updated=0,failed=0;
    for(let i=0;i<draft.changes.length;i++){
      if(decisions[i]!=="accept")continue;
      const change=draft.changes[i];
      const data:Record<string,unknown>={...change.data};
      for(const diff of change.field_diffs)data[diff.field]=coerce(diff.field,valueFor(change,i,diff),change.data[diff.field]);
      try{
        if(change.action==="update"&&change.matched_id){
          await request(`/api/v1/admin/content/${change.kind}/${change.matched_id}`,{method:"PUT",body:JSON.stringify({slug:change.slug,data,sort_order:0,visible:true})});
          updated++;
        }else{
          await request(`/api/v1/admin/content/${change.kind}`,{method:"POST",body:JSON.stringify({slug:change.slug,data,sort_order:0,visible:true})});
          created++;
        }
      }catch{failed++}
    }
    setApplying(false);
    setResult(`${created} eklendi, ${updated} güncellendi${failed?`, ${failed} başarısız`:""}.`);
  }

  // Preserve array-typed fields (tech_stack, items): if the original was an
  // array, split the edited comma string back into an array.
  function coerce(field:string,value:string,original:unknown):unknown{
    if(Array.isArray(original)||field==="tech_stack"||field==="items")return value.split(",").map(v=>v.trim()).filter(Boolean);
    return value;
  }

  const grouped=draft.changes.map((c,i)=>({c,i})).reduce<Record<string,{c:Change;i:number}[]>>((acc,x)=>{(acc[x.c.kind]??=[]).push(x);return acc},{});

  return <div className="cv-review">
    {error&&<div className="error">{error}</div>}
    {Object.entries(grouped).map(([kind,entries])=><div key={kind} className="cv-group">
      <h2 className="cv-group-h">{kindLabel[kind]||kind}</h2>
      {entries.map(({c,i})=><ChangeCard key={i} change={c} index={i} decision={decisions[i]} onDecision={d=>setDecisions({...decisions,[i]:d})} valueFor={valueFor} onEdit={setEdit}/>)}
    </div>)}
    {draft.orphans.length>0&&<div className="cv-group"><h2 className="cv-group-h">CV’de bulunmayanlar</h2>
      {draft.orphans.map(o=><div key={`${o.kind}-${o.id}`} className="cv-orphan">{kindLabel[o.kind]||o.kind}: <strong>{o.label||o.slug}</strong> — bu CV’de yok. Silmek istersen ilgili bölümden elle sil. (Otomatik silinmez.)</div>)}
    </div>}
    <div className="cv-apply-bar">
      <button className="primary" disabled={applying} onClick={apply}>{applying?"Uygulanıyor…":"Seçilenleri uygula"}</button>
      {result&&<span className="notice" style={{margin:0}}>{result}</span>}
    </div>
  </div>;
}

function ChangeCard({change,index,decision,onDecision,valueFor,onEdit}:{change:Change;index:number;decision:Decision;onDecision:(d:Decision)=>void;valueFor:(c:Change,i:number,d:FieldDiff)=>string;onEdit:(i:number,field:string,value:string)=>void}){
  const visible=change.field_diffs.filter(d=>d.changed);
  return <div className={`cv-card ${decision}`}>
    <div className="cv-card-head">
      <span className={`cv-badge cv-${change.action}`}>{change.action==="create"?"YENİ":"GÜNCELLEME"}</span>
      <strong>{change.slug}</strong>
      <div className="cv-card-actions">
        <button type="button" className={decision==="accept"?"primary":"secondary"} onClick={()=>onDecision("accept")}>Kabul</button>
        <button type="button" className={decision==="skip"?"danger":"secondary"} onClick={()=>onDecision("skip")}>Atla</button>
      </div>
    </div>
    <div className="cv-fields">
      {visible.map(diff=><div key={diff.field} className="cv-field">
        <div className="cv-field-key">{diff.field}{diff.auto_translated&&<span className="cv-flag">otomatik çeviri</span>}</div>
        {change.action==="update"&&diff.old&&<div className="cv-old">- {diff.old}</div>}
        <textarea className="cv-new" value={valueFor(change,index,diff)} onChange={e=>onEdit(index,diff.field,e.target.value)}/>
      </div>)}
    </div>
  </div>;
}
