"use client";
import {FormEvent} from "react";
import {Field,Item,LanguageTab,fieldLabel,filterFields,valueFor} from "./schema";
import {FileField,LanguageTabs} from "./fields";

export default function ContentEditor({editing,setEditing,setDirty,schema,section,languageTab,setLanguageTab,saving,uploading,dirty,updateField,uploadForItem,onSubmit,onCancel}:{
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
  updateField:(field:Field,value:string|boolean)=>void;
  uploadForItem:(key:string,file:File)=>void;
  onSubmit:(event:FormEvent)=>void;
  onCancel:()=>void;
}){
  return <form className="editor" onSubmit={onSubmit}>
    <LanguageTabs value={languageTab} onChange={setLanguageTab}/>
    <div className="field"><label>Slug</label><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={editing.slug} onChange={e=>{setEditing({...editing,slug:e.target.value});setDirty(true)}}/></div>
    <div className="field"><label>Sıra</label><input type="number" value={editing.sort_order} onChange={e=>{setEditing({...editing,sort_order:Number(e.target.value)});setDirty(true)}}/></div>
    {section==="projects"&&<div className="admin-form-preview full"><span className="admin-preview-label">Site kartı önizlemesi</span><div className="admin-project-preview"><strong>{String(editing.data[`name_${languageTab}`]||editing.data.name_tr||editing.data.name_en||"Proje adı")}</strong><p>{String(editing.data[`description_${languageTab}`]||editing.data.description_tr||editing.data.description_en||"Kısa proje açıklaması burada görünecek.")}</p><small>{[editing.data.category,editing.data.employer,editing.data.year].filter(Boolean).map(String).join(" · ")||"Kategori · Şirket · Yıl"}</small><div>{Array.isArray(editing.data.tech_stack)?editing.data.tech_stack.slice(0,5).map(value=><span key={String(value)}>{String(value)}</span>):null}</div></div></div>}
    {filterFields(schema.fields,languageTab).map(field=>field.type==="file"?<FileField key={field.key} field={{...field,label:fieldLabel(field)}} value={String(editing.data[field.key]||"")} onFile={file=>uploadForItem(field.key,file)} uploading={uploading}/>:<div className={`field ${field.type==="textarea"?"full":""}`} key={field.key}><label>{fieldLabel(field)}</label>{field.type==="textarea"?<textarea lang={field.key.endsWith("_en")?"en":"tr"} value={valueFor(field,editing.data[field.key])} onChange={e=>updateField(field,e.target.value)}/>:field.type==="select"?<select value={valueFor(field,editing.data[field.key])} onChange={e=>updateField(field,e.target.value)}>{field.options?.map(option=><option key={option}>{option}</option>)}</select>:field.type==="checkbox"?<input type="checkbox" checked={Boolean(editing.data[field.key])} onChange={e=>updateField(field,e.target.checked)}/>:<input lang={field.key.endsWith("_en")?"en":"tr"} value={valueFor(field,editing.data[field.key])} onChange={e=>updateField(field,e.target.value)}/>}</div>)}
    <div className="field"><label>Yayında</label><input type="checkbox" checked={editing.visible} onChange={e=>{setEditing({...editing,visible:e.target.checked});setDirty(true)}}/></div>
    <div className="editor-actions admin-sticky-actions full"><span className={dirty?"admin-save-state is-dirty":"admin-save-state"}>{dirty?"Kaydedilmemiş değişiklikler":"Tüm değişiklikler kayıtlı"}</span><button type="button" className="secondary" disabled={saving} onClick={onCancel}>Vazgeç</button><button className="primary" disabled={saving||Boolean(uploading)}>{saving?"Kaydediliyor…":"Kaydet"}</button></div>
  </form>;
}
