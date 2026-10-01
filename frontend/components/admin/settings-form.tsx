"use client";
import {FormEvent} from "react";
import {LanguageTab,fieldLabel,filterFields,settingFields} from "./schema";
import {FileField,LanguageTabs} from "./fields";

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
  return <form onSubmit={onSubmit}>
    <div className="toolbar"><div><h1>Site ve marka</h1><p>Metinleri ve görsel kimliği buradan yönet.</p></div></div>
    <div className="editor">
      <LanguageTabs value={languageTab} onChange={setLanguageTab}/>
      {filterFields(settingFields,languageTab).map(field=>field.type==="file"?
        <FileField key={field.key} field={{...field,label:fieldLabel(field)}} value={settings[field.key]||""} onFile={file=>uploadForSetting(field.key,file)} uploading={uploading}/>:
        <div className={`field ${field.type==="textarea"?"full":""}`} key={field.key}>
          <label>{fieldLabel(field)}</label>
          {field.type==="textarea"?<textarea lang={field.key.endsWith("_en")?"en":"tr"} value={settings[field.key]||""} onChange={e=>{setSettings({...settings,[field.key]:e.target.value});setDirty(true)}}/>:<input lang={field.key.endsWith("_en")?"en":"tr"} value={settings[field.key]||""} onChange={e=>{setSettings({...settings,[field.key]:e.target.value});setDirty(true)}}/>}
        </div>)}
      <div className="editor-actions admin-sticky-actions full"><span className={dirty?"admin-save-state is-dirty":"admin-save-state"}>{dirty?"Kaydedilmemiş değişiklikler":"Tüm değişiklikler kayıtlı"}</span><button className="primary" disabled={saving||Boolean(uploading)}>{saving?"Kaydediliyor…":"Ayarları kaydet"}</button></div>
    </div>
  </form>;
}
