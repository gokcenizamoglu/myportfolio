"use client";
import {FormEvent,KeyboardEvent,useRef,useState} from "react";
import {Field,Item,LanguageTab,fieldLabel,filterFields,valueFor} from "./schema";
import {FileField,LanguageTabs} from "./fields";
import {hasCriticalPublicationIssues,type HealthIssue} from "@/lib/content-health";
import ProjectPreview,{ProjectCardPreview} from "./project-preview";
import SeoPreview from "./seo-preview";
import {seoSiteUrl} from "@/lib/seo";

export default function ContentEditor({editing,setEditing,setDirty,schema,section,languageTab,setLanguageTab,saving,uploading,dirty,healthIssues,updateField,uploadForItem,onSubmit,onCancel}:{
  editing:Item;
  setEditing:(value:Item)=>void;
  setDirty:(value:boolean)=>void;
  schema:{label:string;title:string;fields:Field[]};
  section:string;
  languageTab:LanguageTab;
  setLanguageTab:(tab:LanguageTab)=>void;
  saving:boolean;
  uploading:string;
  dirty:boolean;
  healthIssues:HealthIssue[];
  updateField:(field:Field,value:string|boolean)=>void;
  uploadForItem:(key:string,file:File)=>void;
  onSubmit:(event:FormEvent)=>void;
  onCancel:()=>void;
}){
  const [previewOpen,setPreviewOpen]=useState(false);
  const textareaRefs=useRef<Record<string,HTMLTextAreaElement|null>>({});
  const isBulletField=(field:Field)=>field.key.startsWith("description_")&&section==="experiences"||field.key.startsWith("highlights_")&&section==="projects";
  const insertText=(field:Field,text:string,start:number,end:number,selectionOffset:number)=>{
    const current=valueFor(field,editing.data[field.key]);
    updateField(field,`${current.slice(0,start)}${text}${current.slice(end)}`);
    requestAnimationFrame(()=>{const area=textareaRefs.current[field.key];if(area){area.focus();area.setSelectionRange(start+selectionOffset,start+selectionOffset)}});
  };
  const addBullet=(field:Field)=>{
    const area=textareaRefs.current[field.key];if(!area)return;
    const current=valueFor(field,editing.data[field.key]);
    const prefix=area.selectionStart>0&&!current.slice(0,area.selectionStart).endsWith("\n")?"\n":"";
    const addition=`${prefix}- `;
    insertText(field,addition,area.selectionStart,area.selectionEnd,addition.length);
  };
  const continueBullet=(event:KeyboardEvent<HTMLTextAreaElement>,field:Field)=>{
    if(event.key!=="Enter")return;
    const area=event.currentTarget;
    const line=valueFor(field,editing.data[field.key]).slice(0,area.selectionStart).split(/\r?\n/).at(-1)||"";
    if(!/^\s*[-•*]\s+/u.test(line))return;
    event.preventDefault();insertText(field,"\n- ",area.selectionStart,area.selectionEnd,3);
  };
  return <form className="editor" onSubmit={onSubmit} aria-busy={saving||Boolean(uploading)} onKeyDown={event=>{if(event.key==="Escape"&&!(event.target as HTMLElement).closest(".admin-preview-overlay")){event.preventDefault();onCancel()}}}>
    <LanguageTabs value={languageTab} onChange={setLanguageTab}/>
    {healthIssues.length>0&&<div className={`editor-health full ${hasCriticalPublicationIssues(editing.visible,healthIssues)?"has-critical":""}`}><div><strong>{hasCriticalPublicationIssues(editing.visible,healthIssues)?"Yayın için kritik alanlar eksik":"İçerik iyileştirmeleri"}</strong><span>Bu uyarılar kaydetmeyi engellemez.</span></div><ul>{healthIssues.slice(0,6).map((issue,index)=><li key={`${issue.code}-${issue.field}-${index}`}><i className={issue.severity}/><span>{issue.message}</span>{issue.locale&&<button type="button" onClick={()=>setLanguageTab(issue.locale as LanguageTab)}>{issue.locale.toUpperCase()}</button>}</li>)}</ul></div>}
    <div className="field"><label htmlFor="content-slug">Slug</label><input id="content-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={editing.slug} onChange={e=>{setEditing({...editing,slug:e.target.value});setDirty(true)}}/></div>
    <div className="field"><label htmlFor="content-order">Sıra</label><input id="content-order" type="number" value={editing.sort_order} onChange={e=>{setEditing({...editing,sort_order:Number(e.target.value)});setDirty(true)}}/></div>
    {section==="projects"&&<div className="admin-form-preview full"><div className="admin-preview-heading"><span className="admin-preview-label">Site kartı önizlemesi · {languageTab.toUpperCase()}</span><button type="button" className="secondary" onClick={()=>setPreviewOpen(true)}>Tam önizleme</button></div><ProjectCardPreview item={editing} locale={languageTab}/></div>}
    {section==="projects"&&<SeoPreview title={`${String(editing.data[`name_${languageTab}`]||editing.data.name_tr||editing.data.name_en||"Proje")} — Gökçe Güler`} description={String(editing.data[`description_${languageTab}`]||editing.data.description_tr||editing.data.description_en||"")} canonical={`${seoSiteUrl()}/${languageTab}/projects/${editing.slug||"proje-slug"}`} indexable={editing.visible} inSitemap={editing.visible&&Boolean(editing.slug)}/>}
    {filterFields(schema.fields,languageTab).map(field=>{const id=`content-${field.key}`;const bulletField=isBulletField(field);return field.type==="file"?<FileField key={field.key} field={{...field,label:fieldLabel(field)}} value={String(editing.data[field.key]||"")} onFile={file=>uploadForItem(field.key,file)} uploading={uploading}/>:<div className={`field ${field.type==="textarea"?"full":""}`} key={field.key}><label htmlFor={id}>{fieldLabel(field)}</label>{bulletField&&<div className="admin-text-tools"><button type="button" onClick={()=>addBullet(field)}>+ Madde ekle</button><span>Enter ile sonraki maddeye geçebilirsiniz.</span></div>}{field.type==="textarea"?<textarea ref={element=>{textareaRefs.current[field.key]=element}} id={id} lang={field.key.endsWith("_en")?"en":"tr"} value={valueFor(field,editing.data[field.key])} onKeyDown={event=>bulletField&&continueBullet(event,field)} onChange={e=>updateField(field,e.target.value)}/>:field.type==="select"?<select id={id} value={valueFor(field,editing.data[field.key])} onChange={e=>updateField(field,e.target.value)}>{field.options?.map(option=><option key={option}>{option}</option>)}</select>:field.type==="checkbox"?<input id={id} type="checkbox" checked={Boolean(editing.data[field.key])} onChange={e=>updateField(field,e.target.checked)}/>:<input id={id} lang={field.key.endsWith("_en")?"en":"tr"} value={valueFor(field,editing.data[field.key])} onChange={e=>updateField(field,e.target.value)}/>}</div>})}
    <div className="field"><label htmlFor="content-visible">Yayında</label><input id="content-visible" type="checkbox" checked={editing.visible} onChange={e=>{setEditing({...editing,visible:e.target.checked});setDirty(true)}}/></div>
    <div className="editor-actions admin-sticky-actions full"><span className={dirty?"admin-save-state is-dirty":"admin-save-state"} role="status">{uploading?"Dosya yükleniyor…":dirty?"Kaydedilmemiş değişiklikler":"Tüm değişiklikler kayıtlı"}</span><button type="button" className="secondary" disabled={saving||Boolean(uploading)} onClick={onCancel}>Vazgeç</button><button className="primary" disabled={saving||Boolean(uploading)}>{saving?"Kaydediliyor…":"Kaydet"}</button></div>
    {previewOpen&&<ProjectPreview item={editing} locale={languageTab} onClose={()=>setPreviewOpen(false)}/>}
  </form>;
}
