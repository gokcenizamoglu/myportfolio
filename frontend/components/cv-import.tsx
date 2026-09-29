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
    {error&&<div className="error" role="alert" style={{marginBottom:16}}>{error}</div>}
    <div className="cv-upload">
      <label>CV dili
        <select value={lang} onChange={e=>setLang(e.target.value as "tr"|"en")}><option value="tr">Türkçe</option><option value="en">English</option></select>
      </label>
      <input type="file" accept=".pdf" aria-label="CV PDF dosyası" disabled={loading} onChange={e=>{const f=e.target.files?.[0];if(f)onFile(f)}}/>
      {loading&&<small>Gemini CV’yi okuyor…</small>}
      <p className="cv-hint">PDF yüklersin, Gemini içeriği çıkarır; hiçbir şey sen onaylamadan kaydedilmez.</p>
    </div>
    {draft&&<CvReview draft={draft} request={request}/>}
  </div>;
}

type Decision="accept"|"skip";
type Existing={id:number;slug:string;data:Record<string,unknown>;sort_order:number;visible:boolean};
type Failure={slug:string;message:string};

// Coerce an edited string back to the original value's type; never stringify typed data.
function coerce(field:string,value:string,original:unknown):unknown{
  if(Array.isArray(original)||field==="tech_stack"||field==="items")return value.split(",").map(v=>v.trim()).filter(Boolean);
  if(typeof original==="number")return value.trim()===""?original:(Number.isNaN(Number(value))?value:Number(value));
  if(typeof original==="boolean")return value==="true";
  return value;
}

function CvReview({draft,request}:{draft:Draft;request:ApiRequest}){
  const [decisions,setDecisions]=useState<Record<number,Decision>>(()=>Object.fromEntries(draft.changes.map((_,i)=>[i,"accept"])));
  const [edits,setEdits]=useState<Record<number,Record<string,string>>>({});
  const [applied,setApplied]=useState<Record<number,boolean>>({});
  const [applying,setApplying]=useState(false);
  const [result,setResult]=useState("");
  const [failures,setFailures]=useState<Failure[]>([]);

  function setEdit(index:number,field:string,value:string){setEdits(prev=>({...prev,[index]:{...prev[index],[field]:value}}))}
  function valueFor(index:number,diff:FieldDiff){return edits[index]?.[diff.field]??diff.new}

  const pending=draft.changes.map((_,i)=>i).filter(i=>decisions[i]==="accept"&&!applied[i]);

  async function apply(){
    setApplying(true);setResult("");setFailures([]);
    let created=0,updated=0;
    const failed:Failure[]=[];
    const kinds=Array.from(new Set(pending.map(i=>draft.changes[i].kind)));
    const existingByKind:Record<string,{byId:Map<number,Existing>;maxOrder:number}>={};
    const brokenKinds:Record<string,string>={};
    for(const kind of kinds){
      try{
        const list:Existing[]=await request(`/api/v1/admin/content/${kind}`);
        existingByKind[kind]={byId:new Map(list.map(x=>[x.id,x])),maxOrder:Math.max(0,...list.map(x=>x.sort_order??0))};
      }catch(e){brokenKinds[kind]=(e as Error).message||"Mevcut kayıtlar okunamadı"}
    }
    for(const i of pending){
      const change=draft.changes[i];
      if(brokenKinds[change.kind]){failed.push({slug:change.slug,message:brokenKinds[change.kind]});continue}
      const ctx=existingByKind[change.kind];
      try{
        if(change.action==="update"&&change.matched_id!=null){
          const current=ctx.byId.get(change.matched_id);
          if(!current)throw new Error("Eşleşen kayıt bulunamadı");
          const data:Record<string,unknown>={...current.data};
          for(const diff of change.field_diffs){
            if(diff.changed||edits[i]?.[diff.field]!==undefined)data[diff.field]=coerce(diff.field,valueFor(i,diff),current.data[diff.field]);
          }
          await request(`/api/v1/admin/content/${change.kind}/${change.matched_id}`,{method:"PUT",body:JSON.stringify({slug:change.slug,data,sort_order:current.sort_order})});
          updated++;
        }else{
          const data:Record<string,unknown>={...change.data};
          for(const diff of change.field_diffs){
            if(diff.changed||edits[i]?.[diff.field]!==undefined)data[diff.field]=coerce(diff.field,valueFor(i,diff),change.data[diff.field]);
          }
          ctx.maxOrder+=1;
          await request(`/api/v1/admin/content/${change.kind}`,{method:"POST",body:JSON.stringify({slug:change.slug,data,sort_order:ctx.maxOrder,visible:true})});
          created++;
        }
        setApplied(prev=>({...prev,[i]:true}));
      }catch(e){failed.push({slug:change.slug,message:(e as Error).message||"Bilinmeyen hata"})}
    }
    setApplying(false);
    setFailures(failed);
    setResult(`${created} eklendi, ${updated} güncellendi${failed.length?`, ${failed.length} başarısız`:""}.`);
  }

  const grouped=draft.changes.map((c,i)=>({c,i})).reduce<Record<string,{c:Change;i:number}[]>>((acc,x)=>{(acc[x.c.kind]??=[]).push(x);return acc},{});

  return <div className="cv-review">
    {Object.entries(grouped).map(([kind,entries])=><div key={kind} className="cv-group">
      <h2 className="cv-group-h">{kindLabel[kind]||kind}</h2>
      {entries.map(({c,i})=><ChangeCard key={i} change={c} index={i} decision={decisions[i]} done={!!applied[i]} onDecision={d=>setDecisions(p=>({...p,[i]:d}))} valueFor={valueFor} onEdit={setEdit}/>)}
    </div>)}
    {draft.orphans.length>0&&<div className="cv-group"><h2 className="cv-group-h">CV’de bulunmayanlar</h2>
      {draft.orphans.map(o=><div key={`${o.kind}-${o.id}`} className="cv-orphan">{kindLabel[o.kind]||o.kind}: <strong>{o.label||o.slug}</strong> — bu CV’de yok. Silmek istersen ilgili bölümden elle sil. (Otomatik silinmez.)</div>)}
    </div>}
    <div className="cv-apply-bar">
      <button className="primary" disabled={applying||pending.length===0} onClick={apply}>{applying?"Uygulanıyor…":"Seçilenleri uygula"}</button>
      {result&&<span className="notice" role="status" style={{margin:0}}>{result}</span>}
    </div>
    {failures.length>0&&<div className="error" role="alert"><strong>Başarısız olanlar:</strong>
      <ul>{failures.map((f,k)=><li key={k}>{f.slug}: {f.message}</li>)}</ul>
    </div>}
  </div>;
}

function ChangeCard({change,index,decision,done,onDecision,valueFor,onEdit}:{change:Change;index:number;decision:Decision;done:boolean;onDecision:(d:Decision)=>void;valueFor:(i:number,d:FieldDiff)=>string;onEdit:(i:number,field:string,value:string)=>void}){
  const visible=change.field_diffs.filter(d=>d.changed);
  return <div className={`cv-card ${decision}${done?" done":""}`}>
    <div className="cv-card-head">
      <span className={`cv-badge cv-${change.action}`}>{change.action==="create"?"YENİ":"GÜNCELLEME"}</span>
      <strong>{change.slug}</strong>
      {done&&<span className="cv-badge cv-done-tag">uygulandı</span>}
      <div className="cv-card-actions">
        <button type="button" aria-pressed={decision==="accept"} disabled={done} className={decision==="accept"?"primary":"secondary"} onClick={()=>onDecision("accept")}>Kabul</button>
        <button type="button" aria-pressed={decision==="skip"} disabled={done} className={decision==="skip"?"danger":"secondary"} onClick={()=>onDecision("skip")}>Atla</button>
      </div>
    </div>
    <div className="cv-fields">
      {visible.map(diff=><div key={diff.field} className="cv-field">
        <div className="cv-field-key">{diff.field}{diff.auto_translated&&<span className="cv-flag">otomatik çeviri</span>}</div>
        {change.action==="update"&&diff.old&&<div className="cv-old">- {diff.old}</div>}
        <textarea className="cv-new" aria-label={diff.field} disabled={done} value={valueFor(index,diff)} onChange={e=>onEdit(index,diff.field,e.target.value)}/>
      </div>)}
    </div>
  </div>;
}
