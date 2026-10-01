// Shared admin content model: the field schema the editor renders and the pure
// helpers that operate on it. Keeping this free of React and of component state
// lets the editor, list and settings views share one definition.

export type Item={id:number;slug:string;data:Record<string,unknown>;sort_order:number;visible:boolean};
export type Field={key:string;label:string;type?:"text"|"textarea"|"list"|"file"|"select"|"checkbox";options?:string[]};
export type LanguageTab="tr"|"en";

const bilingual=(key:string,label:string,type:Field["type"]="text"):Field[]=>[{key:`${key}_tr`,label:`${label} — Türkçe`,type},{key:`${key}_en`,label:`${label} — English`,type}];

export const schemas:Record<string,{label:string;title:string;fields:Field[]}>= {
  projects:{label:"Projeler",title:"name_tr",fields:[{key:"featured",label:"Öne çıkan proje",type:"checkbox"},{key:"open_source",label:"Açık kaynak",type:"checkbox"},...bilingual("name","Proje adı"),...bilingual("description","Kısa açıklama","textarea"),...bilingual("role","Rolüm"),...bilingual("problem","Problem / ihtiyaç","textarea"),...bilingual("body","Katkım / çözüm","textarea"),...bilingual("highlights","Öne çıkanlar — her satıra bir madde","textarea"),...bilingual("outcome","Sonuç / etki","textarea"),{key:"tech_stack",label:"Teknolojiler (virgülle)",type:"list"},{key:"category",label:"Kategori"},{key:"employer",label:"Şirket"},{key:"year",label:"Yıl"},{key:"live_url",label:"Ürün / tanıtım sitesi URL"},{key:"github_url",label:"GitHub repository URL"}]},
  experiences:{label:"Deneyim",title:"role_tr",fields:[...bilingual("role","Rol"),{key:"company",label:"Şirket"},...bilingual("description","Açıklama","textarea"),{key:"tech_stack",label:"Teknolojiler",type:"list"},{key:"start_date",label:"Başlangıç"},{key:"end_date",label:"Bitiş"}]},
  education:{label:"Eğitim",title:"school_tr",fields:[...bilingual("school","Okul"),...bilingual("degree","Bölüm / derece"),...bilingual("detail","Detay"),{key:"start_date",label:"Başlangıç"},{key:"end_date",label:"Bitiş"}]},
  certifications:{label:"Sertifikalar",title:"name_tr",fields:[...bilingual("name","Sertifika adı"),...bilingual("description","Açıklama","textarea"),{key:"issuer",label:"Veren kurum"},{key:"year",label:"Yıl"},{key:"attachment_url",label:"Sertifika dosyası",type:"file"}]},
  skills:{label:"Yetenekler",title:"group_tr",fields:[...bilingual("group","Grup adı"),{key:"items",label:"Yetenekler (virgülle)",type:"list"}]},
  socials:{label:"İletişim",title:"label_tr",fields:[...bilingual("label","Bağlantı adı"),{key:"url",label:"URL"}]},
  documents:{label:"Ekler ve CV",title:"title_tr",fields:[...bilingual("title","Belge adı"),...bilingual("description","Açıklama","textarea"),{key:"category",label:"Tür",type:"select",options:["cv","certificate","attachment"]},{key:"file_url",label:"PDF veya görsel",type:"file"},{key:"year",label:"Yıl"}]},
};

export const settingFields:Field[]=[
  {key:"name",label:"İsim"},...bilingual("title","Unvan"),...bilingual("tagline","Ana mesaj","textarea"),...bilingual("about_lead","Hakkımda giriş","textarea"),...bilingual("about_body","Hakkımda metni","textarea"),...bilingual("availability","Ulaşılabilirlik cümlesi","textarea"),{key:"location",label:"Konum"},{key:"seo_description",label:"SEO açıklaması",type:"textarea"},
  {key:"logo_mark_url",label:"Küçük logo / monogram",type:"file"},{key:"logo_wordmark_url",label:"Gökçe Güler ana logo",type:"file"},{key:"tile_about_image",label:"Hakkımda kutusu görseli",type:"file"},{key:"tile_experience_image",label:"Deneyim kutusu görseli",type:"file"},{key:"tile_work_image",label:"Projeler kutusu görseli",type:"file"},{key:"tile_contact_image",label:"İletişim kutusu görseli",type:"file"},
];

export function valueFor(field:Field,value:unknown){return field.type==="list"&&Array.isArray(value)?value.join(", "):String(value||"")}
export function slugify(value:string){return value.normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/ı/g,"i").replace(/İ/g,"I").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}
export function searchable(value:string){return value.normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/ı/g,"i")}
export function fieldLabel(field:Field){return field.label.replace(/ — (Türkçe|English)$/u,"")}
// filterFields hides the inactive language's bilingual fields, so one tab shows
// only Turkish (or English) variants plus the shared, non-bilingual fields.
export function filterFields(fields:Field[],languageTab:LanguageTab){return fields.filter(field=>!field.key.endsWith("_tr")&&!field.key.endsWith("_en")||field.key.endsWith(`_${languageTab}`))}
