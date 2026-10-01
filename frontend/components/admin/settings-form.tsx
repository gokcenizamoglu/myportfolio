"use client";
import {FormEvent} from "react";
import {LanguageTab,fieldLabel,filterFields,settingFields} from "./schema";
import {FileField,LanguageTabs} from "./fields";
import SeoPreview from "./seo-preview";

export default function SettingsForm({settings,setSettings,setDirty,uploadForSetting,languageTab,setLanguageTab,dirty,saving,uploading,onSubmit}:{
  settings:Record<string,string>;
  setSettings:(value:Record<string,string>)=>void;
  setDirty:(value:boolean)=>void;
  uploadForSetting:(key:string,file:File)=>void;
  languageTab:LanguageTab;
  setLanguageTab:(tab:LanguageTab)=>void;
  dirty:boolean;
  saving:boolean;
  uploading:string;
  onSubmit:(event:FormEvent)=>void;
}){
  const name=settings.name||"Gökçe Güler";const title=settings[`seo_title_${languageTab}`]||[name,settings[`title_${languageTab}`]].filter(Boolean).join(" — ");const description=settings[`seo_description_${languageTab}`]||settings.seo_description||settings[`tagline_${languageTab}`]||"";const canonical=`${process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"}/${languageTab}`;
  return <form onSubmit={onSubmit}>
    <div className="toolbar"><div><h1>Site ve marka</h1><p>Metinleri ve görsel kimliği buradan yönet.</p></div></div>
    <div className="editor">
      <LanguageTabs value={languageTab} onChange={setLanguageTab}/>
      <SeoPreview title={title} description={description} canonical={canonical} indexable inSitemap/>
      {filterFields(settingFields,languageTab).map(field=>field.type==="file"?
        <FileField key={field.key} field={{...field,label:fieldLabel(field)}} value={settings[field.key]||""} onFile={file=>uploadForSetting(field.key,file)} uploading={uploading}/>:
        <div className={`field ${field.type==="textarea"?"full":""}`} key={field.key}>
          <label htmlFor={`setting-${field.key}`}>{fieldLabel(field)}</label>
          {field.type==="textarea"?<textarea id={`setting-${field.key}`} lang={field.key.endsWith("_en")?"en":"tr"} value={settings[field.key]||""} onChange={e=>{setSettings({...settings,[field.key]:e.target.value});setDirty(true)}}/>:<input id={`setting-${field.key}`} lang={field.key.endsWith("_en")?"en":"tr"} value={settings[field.key]||""} onChange={e=>{setSettings({...settings,[field.key]:e.target.value});setDirty(true)}}/>}
        </div>)}
      <div className="editor-actions admin-sticky-actions full"><span className={dirty?"admin-save-state is-dirty":"admin-save-state"}>{dirty?"Kaydedilmemiş değişiklikler":"Tüm değişiklikler kayıtlı"}</span><button className="primary" disabled={saving||Boolean(uploading)}>{saving?"Kaydediliyor…":"Ayarları kaydet"}</button></div>
    </div>
  </form>;
}
