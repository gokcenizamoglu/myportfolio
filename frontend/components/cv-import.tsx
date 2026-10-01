"use client";
import {useState} from "react";
import {apiBase} from "@/lib/api";
import {ApiRequest,Change,Decision,Draft,Existing,Failure,FieldDiff,OrphanDecision,coerce,kindLabel} from "@/components/cv-import/types";
import {ChangeCard,SettingCard} from "@/components/cv-import/cards";

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

function CvReview({draft,request}:{draft:Draft;request:ApiRequest}){
  const settingDiffs=draft.settings??[];
  const [decisions,setDecisions]=useState<Record<number,Decision>>(()=>Object.fromEntries(draft.changes.map((_,i)=>[i,"pending"])));
  const [orphanDecisions,setOrphanDecisions]=useState<Record<number,OrphanDecision>>(()=>Object.fromEntries(draft.orphans.map((_,i)=>[i,"keep"])));
  const [settingDecisions,setSettingDecisions]=useState<Record<number,Decision>>(()=>Object.fromEntries(settingDiffs.map((_,i)=>[i,"pending"])));
  const [edits,setEdits]=useState<Record<number,Record<string,string>>>({});
  const [settingEdits,setSettingEdits]=useState<Record<number,string>>({});
  const [slugs,setSlugs]=useState<Record<number,string>>({});
  const [applied,setApplied]=useState<Record<number,boolean>>({});
  const [settingsApplied,setSettingsApplied]=useState<Record<number,boolean>>({});
  const [applying,setApplying]=useState(false);
  const [result,setResult]=useState("");
  const [failures,setFailures]=useState<Failure[]>([]);

  function setEdit(index:number,field:string,value:string){setEdits(prev=>({...prev,[index]:{...prev[index],[field]:value}}))}
  function slugFor(index:number){return slugs[index]??draft.changes[index].slug}
  function valueFor(index:number,diff:FieldDiff){return edits[index]?.[diff.field]??diff.new}

  const pending=draft.changes.map((_,i)=>i).filter(i=>decisions[i]==="accept"&&!applied[i]);
  const pendingDeletes=draft.orphans.map((_,i)=>i).filter(i=>orphanDecisions[i]==="delete"&&!applied[draft.changes.length+i]);
  const pendingSettings=settingDiffs.map((_,i)=>i).filter(i=>settingDecisions[i]==="accept"&&!settingsApplied[i]);
  const acceptedCount=draft.changes.filter((_,i)=>decisions[i]==="accept").length+settingDiffs.filter((_,i)=>settingDecisions[i]==="accept").length;
  const skippedCount=draft.changes.filter((_,i)=>decisions[i]==="skip").length+settingDiffs.filter((_,i)=>settingDecisions[i]==="skip").length;
  const deleteCount=draft.orphans.filter((_,i)=>orphanDecisions[i]==="delete").length;
  const selectableCount=draft.changes.length+settingDiffs.length;
  const actionCount=pending.length+pendingDeletes.length+pendingSettings.length;

  async function apply(){
    if(pendingDeletes.length>0&&!confirm(`${pendingDeletes.length} mevcut kayıt kalıcı olarak silinecek. Devam edilsin mi?`))return;
    setApplying(true);setResult("");setFailures([]);
    let created=0,updated=0,deleted=0,settingsUpdated=0;
    const failed:Failure[]=[];
    const kinds=Array.from(new Set(pending.map(i=>draft.changes[i].kind)));
    const existingByKind:Record<string,{byId:Map<number,Existing>;maxOrder:number}>={};
    const brokenKinds:Record<string,string>={};
    for(const kind of kinds){
      try{
        const list=await request<Existing[]>(`/api/v1/admin/content/${kind}`);
        existingByKind[kind]={byId:new Map(list.map(x=>[x.id,x])),maxOrder:Math.max(0,...list.map(x=>x.sort_order??0))};
      }catch(e){brokenKinds[kind]=(e as Error).message||"Mevcut kayıtlar okunamadı"}
    }
    for(const i of pending){
      const change=draft.changes[i];
      if(brokenKinds[change.kind]){failed.push({slug:change.slug,message:brokenKinds[change.kind]});continue}
      const slug=slugFor(i).trim();
      if(slug===""){failed.push({slug:change.slug||"(boş)",message:"Slug boş olamaz"});continue}
      const ctx=existingByKind[change.kind];
      try{
        if(change.action==="update"&&change.matched_id!=null){
          const current=ctx.byId.get(change.matched_id);
          if(!current)throw new Error("Eşleşen kayıt bulunamadı");
          const data:Record<string,unknown>={...current.data};
          for(const diff of change.field_diffs){
            if(diff.changed||edits[i]?.[diff.field]!==undefined)data[diff.field]=coerce(diff.field,valueFor(i,diff),current.data[diff.field]);
          }
          await request(`/api/v1/admin/content/${change.kind}/${change.matched_id}`,{method:"PUT",body:JSON.stringify({slug,data,sort_order:current.sort_order})});
          updated++;
        }else{
          const data:Record<string,unknown>={...change.data};
          for(const diff of change.field_diffs){
            if(diff.changed||edits[i]?.[diff.field]!==undefined)data[diff.field]=coerce(diff.field,valueFor(i,diff),change.data[diff.field]);
          }
          ctx.maxOrder+=1;
          await request(`/api/v1/admin/content/${change.kind}`,{method:"POST",body:JSON.stringify({slug,data,sort_order:ctx.maxOrder,visible:true})});
          created++;
        }
        setApplied(prev=>({...prev,[i]:true}));
      }catch(e){failed.push({slug:change.slug,message:(e as Error).message||"Bilinmeyen hata"})}
    }
    for(const i of pendingDeletes){
      const orphan=draft.orphans[i];
      try{
        await request(`/api/v1/admin/content/${orphan.kind}/${orphan.id}`,{method:"DELETE"});
        deleted++;
        setApplied(prev=>({...prev,[draft.changes.length+i]:true}));
      }catch(e){failed.push({slug:orphan.slug,message:(e as Error).message||"Silinemedi"})}
    }
    if(pendingSettings.length>0){
      try{
        const current=await request<Record<string,string>>("/api/v1/admin/settings");
        const next={...current};
        for(const i of pendingSettings)next[settingDiffs[i].field]=settingEdits[i]??settingDiffs[i].new;
        await request("/api/v1/admin/settings",{method:"PUT",body:JSON.stringify(next)});
        settingsUpdated=pendingSettings.length;
        setSettingsApplied(prev=>({...prev,...Object.fromEntries(pendingSettings.map(i=>[i,true]))}));
      }catch(e){failed.push({slug:"Site metinleri",message:(e as Error).message||"Ayarlar kaydedilemedi"})}
    }
    setApplying(false);
    setFailures(failed);
    setResult(`${created} eklendi, ${updated} içerik ve ${settingsUpdated} site alanı güncellendi, ${deleted} silindi${failed.length?`, ${failed.length} başarısız`:""}.`);
  }

  const grouped=draft.changes.map((c,i)=>({c,i})).reduce<Record<string,{c:Change;i:number}[]>>((acc,x)=>{(acc[x.c.kind]??=[]).push(x);return acc},{});

  return <div className="cv-review">
    <div className="cv-apply-bar" role="region" aria-label="CV değişikliklerini uygulama">
      <div className="cv-selection-summary">
        <strong>{acceptedCount} / {selectableCount} değişiklik seçildi</strong>
        {skippedCount>0&&<span>{skippedCount} atlandı</span>}
        {deleteCount>0&&<span>{deleteCount} mevcut kayıt silinecek</span>}
        {acceptedCount===0&&deleteCount===0&&<span>Kartlardaki “Kabul” veya “Sil” düğmesiyle işlemleri seç.</span>}
      </div>
      <button type="button" className="primary" disabled={applying||actionCount===0} onClick={apply}>{applying?"Uygulanıyor…":`Seçilenleri uygula (${actionCount})`}</button>
      {result&&<span className="notice" role="status" style={{margin:0}}>{result}</span>}
    </div>
    {Object.entries(grouped).map(([kind,entries])=><div key={kind} className="cv-group">
      <h2 className="cv-group-h">{kindLabel[kind]||kind}</h2>
      {entries.map(({c,i})=><ChangeCard key={i} change={c} index={i} decision={decisions[i]} done={!!applied[i]} onDecision={d=>setDecisions(p=>({...p,[i]:d}))} slug={slugFor(i)} onSlug={v=>setSlugs(p=>({...p,[i]:v}))} valueFor={valueFor} onEdit={setEdit}/>)}
    </div>)}
    {settingDiffs.length>0&&<div className="cv-group"><h2 className="cv-group-h">Site metinleri</h2>
      {settingDiffs.map((diff,i)=><SettingCard key={diff.field} diff={diff} decision={settingDecisions[i]} done={!!settingsApplied[i]} value={settingEdits[i]??diff.new} onValue={value=>setSettingEdits(p=>({...p,[i]:value}))} onDecision={decision=>setSettingDecisions(p=>({...p,[i]:decision}))}/>) }
    </div>}
    {draft.orphans.length>0&&<div className="cv-group"><h2 className="cv-group-h">CV’de bulunmayanlar</h2>
      <p className="cv-orphan-hint">Bu kayıtlar yüklediğin CV’de bulunamadı. Güvenlik için varsayılan olarak korunur; yalnızca “Sil” seçtiklerin uygulanırken kaldırılır.</p>
      {draft.orphans.map((o,i)=>{
        const done=!!applied[draft.changes.length+i];
        const decision=orphanDecisions[i];
        return <div key={`${o.kind}-${o.id}`} className={`cv-orphan ${decision}${done?" done":""}`}>
          <div><span className="cv-badge cv-orphan-kind">{kindLabel[o.kind]||o.kind}</span> <strong>{o.label||o.slug}</strong><small>{o.slug}</small></div>
          {done?<span className="cv-badge cv-done-tag">silindi</span>:<div className="cv-card-actions">
            <button type="button" aria-pressed={decision==="keep"} className={decision==="keep"?"primary":"secondary"} onClick={()=>setOrphanDecisions(p=>({...p,[i]:"keep"}))}>Koru</button>
            <button type="button" aria-pressed={decision==="delete"} className={decision==="delete"?"danger":"secondary"} onClick={()=>setOrphanDecisions(p=>({...p,[i]:"delete"}))}>Sil</button>
          </div>}
        </div>
      })}
    </div>}
    {failures.length>0&&<div className="error" role="alert"><strong>Başarısız olanlar:</strong>
      <ul>{failures.map((f,k)=><li key={k}>{f.slug}: {f.message}</li>)}</ul>
    </div>}
  </div>;
}
