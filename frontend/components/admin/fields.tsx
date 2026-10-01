"use client";
import {apiBase} from "@/lib/api";
import {Field,LanguageTab} from "./schema";

export function FileField({field,value,onFile,uploading}:{field:Field;value:string;onFile:(file:File)=>void;uploading:string}){
  return <div className="field"><label>{field.label}</label>{value&&<>{value.match(/\.(png|jpe?g|webp|svg)$/i)&&<img className="media-preview" src={value.startsWith("/uploads/")?`${apiBase}${value}`:value} alt="Önizleme"/>}<small>{value}</small></>}<input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" disabled={uploading===field.key} onChange={e=>{const file=e.target.files?.[0];if(file)onFile(file)}}/>{uploading===field.key&&<small>Yükleniyor…</small>}</div>;
}

export function LanguageTabs({value,onChange}:{value:LanguageTab;onChange:(tab:LanguageTab)=>void}){
  return <div className="admin-language-tabs full" role="tablist" aria-label="İçerik dili">
    <button type="button" role="tab" aria-selected={value==="tr"} className={value==="tr"?"active":""} onClick={()=>onChange("tr")}>Türkçe</button>
    <button type="button" role="tab" aria-selected={value==="en"} className={value==="en"?"active":""} onClick={()=>onChange("en")}>English</button>
  </div>;
}
