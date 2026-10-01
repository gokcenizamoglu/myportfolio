// Shared contracts and pure helpers for the CV import flow, kept apart from the
// stateful review UI so the data shapes and value coercion can be reasoned about
// (and reused) on their own.

export type ApiRequest=<T=unknown>(path:string,init?:RequestInit)=>Promise<T>;
export type FieldDiff={field:string;old:string;new:string;auto_translated:boolean;changed:boolean};
export type Change={kind:string;action:"create"|"update";matched_id?:number;slug:string;data:Record<string,unknown>;field_diffs:FieldDiff[]};
export type Orphan={kind:string;id:number;slug:string;label:string};
export type Draft={changes:Change[];orphans:Orphan[];settings?:FieldDiff[]};
export type Decision="pending"|"accept"|"skip";
export type OrphanDecision="keep"|"delete";
export type Existing={id:number;slug:string;data:Record<string,unknown>;sort_order:number;visible:boolean};
export type Failure={slug:string;message:string};

export const kindLabel:Record<string,string>={experiences:"Deneyim",education:"Eğitim",certifications:"Sertifikalar",skills:"Yetenekler",projects:"Projeler"};
export const settingLabel:Record<string,string>={tagline_tr:"Ana mesaj — Türkçe",tagline_en:"Ana mesaj — English",about_lead_tr:"Hakkımda giriş — Türkçe",about_lead_en:"Hakkımda giriş — English",about_body_tr:"Hakkımda metni — Türkçe",about_body_en:"Hakkımda metni — English"};

// Coerce an edited string back to the original value's type; never stringify typed data.
export function coerce(field:string,value:string,original:unknown):unknown{
  if(Array.isArray(original)||field==="tech_stack"||field==="items")return value.split(",").map(v=>v.trim()).filter(Boolean);
  if(typeof original==="number")return value.trim()===""?original:(Number.isNaN(Number(value))?value:Number(value));
  if(typeof original==="boolean")return value==="true";
  return value;
}
