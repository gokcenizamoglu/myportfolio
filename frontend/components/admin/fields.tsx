"use client";
import Image from "next/image";
import {apiBase} from "@/lib/api";
import {Field,LanguageTab} from "./schema";

export function FileField({field,value,onFile,uploading}:{field:Field;value:string;onFile:(file:File)=>void;uploading:string}){
  const id=`field-${field.key}`;return <div className="field"><label htmlFor={id}>{field.label}</label>{value&&<>{value.match(/\.(png|jpe?g|webp|svg)$/i)&&<Image unoptimized loader={({src})=>src} className="media-preview" src={value.startsWith("/uploads/")?`${apiBase}${value}`:value} width={320} height={180} alt={`${field.label} önizlemesi`}/>}<small>{value}</small></>}<input id={id} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" disabled={uploading===field.key} aria-describedby={uploading===field.key?`${id}-status`:undefined} onChange={e=>{const file=e.target.files?.[0];if(file)onFile(file)}}/>{uploading===field.key&&<small id={`${id}-status`} role="status">Yükleniyor…</small>}</div>;
}

export function LanguageTabs({value,onChange}:{value:LanguageTab;onChange:(tab:LanguageTab)=>void}){
  return <div className="admin-language-tabs full" role="tablist" aria-label="İçerik dili">
    <button type="button" role="tab" aria-selected={value==="tr"} className={value==="tr"?"active":""} onClick={()=>onChange("tr")}>Türkçe</button>
    <button type="button" role="tab" aria-selected={value==="en"} className={value==="en"?"active":""} onClick={()=>onChange("en")}>English</button>
  </div>;
}
