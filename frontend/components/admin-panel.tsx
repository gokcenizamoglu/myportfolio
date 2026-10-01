"use client";
import {FormEvent,useCallback,useEffect,useMemo,useRef,useState} from "react";
import Image from "next/image";
import {apiRequest,ApiError} from "@/lib/api";
import CvImport from "@/components/cv-import";
import {Field,Item,LanguageTab,schemas,searchable,slugify} from "@/components/admin/schema";
import LoginForm from "@/components/admin/login-form";
import SettingsForm from "@/components/admin/settings-form";
import ContentEditor from "@/components/admin/content-editor";
import ContentList from "@/components/admin/content-list";
import DeleteDialog from "@/components/admin/delete-dialog";
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";
import {hasCriticalPublicationIssues,type HealthIssue} from "@/lib/content-health";

export default function AdminPanel(){
  const [authenticated,setAuthenticated]=useState<boolean|null>(null);const [section,setSection]=useState("dashboard");const [items,setItems]=useState<Item[]>([]);const [editing,setEditing]=useState<Item|null>(null);const [settings,setSettings]=useState<Record<string,string>>({});const [error,setError]=useState("");const [notice,setNotice]=useState("");const [uploading,setUploading]=useState("");const [busy,setBusy]=useState("");const [loading,setLoading]=useState(false);const [saving,setSaving]=useState(false);const [dirty,setDirty]=useState(false);const [languageTab,setLanguageTab]=useState<LanguageTab>("tr");const [deleteTarget,setDeleteTarget]=useState<Item|null>(null);const [query,setQuery]=useState("");const [filter,setFilter]=useState("all");const [login,setLogin]=useState({username:"",password:""});const schema=schemas[section];
  const [editHealth,setEditHealth]=useState<HealthIssue[]>([]);const healthTarget=useRef<HealthIssue|null>(null);
  // Thin wrapper over the shared API client that maps an expired session (401)
  // onto this screen's login state while keeping the admin's Turkish message.
  const request=useCallback(async <T=unknown,>(path:string,init:RequestInit={}):Promise<T>=>{try{return await apiRequest<T>(path,init)}catch(e){if(e instanceof ApiError&&e.status===401){setAuthenticated(false);throw new Error("Lütfen tekrar giriş yap.")}throw e}},[]);
  useEffect(()=>{request("/api/v1/admin/me").then(()=>setAuthenticated(true)).catch(()=>setAuthenticated(false))},[request]);
  useEffect(()=>{if(!authenticated)return;setError("");setEditing(null);setDirty(false);setQuery("");setFilter("all");if(section==="cv-import"||section==="dashboard"){setLoading(false);return}setLoading(true);if(section==="settings"){request<Record<string,string>>("/api/v1/admin/settings").then(setSettings).catch(e=>setError(e.message)).finally(()=>setLoading(false));if(healthTarget.current?.kind==="settings"){setLanguageTab(healthTarget.current.locale||"tr");healthTarget.current=null}return}request<Item[]>(`/api/v1/admin/content/${section}`).then(list=>{setItems(list);if(healthTarget.current?.kind===section){const target=list.find(item=>item.id===healthTarget.current?.id);if(target){setEditing(target);setLanguageTab(healthTarget.current.locale||"tr")}healthTarget.current=null}}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[section,authenticated,request]);
  useEffect(()=>{if(!editing||!schemas[section]){setEditHealth([]);return}const timer=window.setTimeout(()=>{request<{issues:HealthIssue[]}>(`/api/v1/admin/content/${section}/health`,{method:"POST",body:JSON.stringify({id:editing.id,slug:editing.slug,data:editing.data,visible:editing.visible})}).then(result=>setEditHealth(result.issues)).catch(()=>setEditHealth([]))},250);return()=>window.clearTimeout(timer)},[editing,section,request]);
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(!dirty)return;event.preventDefault()};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn)},[dirty]);
  const blank=useMemo<Item>(()=>({id:0,slug:"",data:section==="projects"?{featured:true,open_source:false}:{},sort_order:items.length+1,visible:true}),[items.length,section]);
  async function upload(file:File){const form=new FormData();form.append("file",file);const result=await request<{url:string}>("/api/v1/admin/media",{method:"POST",body:form});return result.url}
  async function uploadForItem(key:string,file:File){if(!editing)return;setUploading(key);setError("");try{const url=await upload(file);setEditing({...editing,data:{...editing.data,[key]:url}});setDirty(true)}catch(e){setError((e as Error).message)}finally{setUploading("")}}
  async function uploadForSetting(key:string,file:File){setUploading(key);setError("");try{const url=await upload(file);setSettings({...settings,[key]:url});setDirty(true)}catch(e){setError((e as Error).message)}finally{setUploading("")}}
  async function signIn(event:FormEvent){event.preventDefault();setError("");try{await request("/api/v1/admin/login",{method:"POST",body:JSON.stringify(login)});setAuthenticated(true)}catch(e){setError((e as Error).message)}}
  async function publicationAllowed(item:Item){if(!item.visible)return true;const result=await request<{issues:HealthIssue[]}>(`/api/v1/admin/content/${section}/health`,{method:"POST",body:JSON.stringify({id:item.id,slug:item.slug,data:item.data,visible:true})});if(!hasCriticalPublicationIssues(true,result.issues))return true;const count=result.issues.filter(issue=>issue.severity==="critical").length;return window.confirm(`Bu kayıtta ${count} kritik yayın uyarısı var. Yine de yayına almak istiyor musun?`)}
  async function saveItem(event:FormEvent){event.preventDefault();if(!editing||saving||uploading)return;setSaving(true);setError("");try{if(!(await publicationAllowed(editing)))return;const method=editing.id?"PUT":"POST";const suffix=editing.id?`/${editing.id}`:"";await request(`/api/v1/admin/content/${section}${suffix}`,{method,body:JSON.stringify({slug:editing.slug,data:editing.data,sort_order:Number(editing.sort_order),visible:editing.visible})});setDirty(false);setEditing(null);setItems(await request<Item[]>(`/api/v1/admin/content/${section}`));flash("Kaydedildi.")}catch(e){setError((e as Error).message)}finally{setSaving(false)}}
  async function confirmDelete(){if(!deleteTarget)return;setBusy(`item-${deleteTarget.id}`);setError("");try{await request(`/api/v1/admin/content/${section}/${deleteTarget.id}`,{method:"DELETE"});setItems(current=>current.filter(item=>item.id!==deleteTarget.id));setDeleteTarget(null);flash("Kayıt silindi.")}catch(e){setError((e as Error).message)}finally{setBusy("")}}
  async function saveSettings(event:FormEvent){event.preventDefault();if(saving)return;setSaving(true);setError("");try{await request("/api/v1/admin/settings",{method:"PUT",body:JSON.stringify(settings)});setDirty(false);flash("Site ayarları kaydedildi.")}catch(e){setError((e as Error).message)}finally{setSaving(false)}}
  async function logout(){if(dirty&&!window.confirm("Kaydedilmemiş değişiklikler var. Yine de çıkış yapmak istiyor musun?"))return;await request("/api/v1/admin/logout",{method:"POST"}).catch(()=>null);setAuthenticated(false)}
  function flash(message:string){setNotice(message);setTimeout(()=>setNotice(""),1800)}
  function updateField(field:Field,value:string|boolean){if(!editing)return;const dataValue=field.type==="list"&&typeof value==="string"?value.split(",").map(v=>v.trim()).filter(Boolean):value;const next={...editing,data:{...editing.data,[field.key]:dataValue}};if(!editing.id&&!editing.slug&&typeof value==="string"&&(field.key==="name_tr"||field.key==="name_en"))next.slug=slugify(value);setEditing(next);setDirty(true)}
  function chooseSection(next:string){if(saving||uploading||busy)return;if(next===section)return;if(dirty&&!window.confirm("Kaydedilmemiş değişiklikler var. Bu bölümden ayrılmak istiyor musun?"))return;setSection(next)}
  function openEditor(item:Item){setEditing(item);setLanguageTab("tr");setDirty(false)}
  function cancelEditor(){if(dirty&&!window.confirm("Kaydedilmemiş değişiklikleri silmek istiyor musun?"))return;setDirty(false);setEditing(null)}
  function openHealthIssue(issue:HealthIssue){healthTarget.current=issue;chooseSection(issue.kind)}
  const orderedItems=useMemo(()=>[...items].sort((a,b)=>a.sort_order-b.sort_order||a.id-b.id),[items]);
  const visibleItems=useMemo(()=>orderedItems.filter(item=>{const haystack=searchable(`${item.slug} ${JSON.stringify(item.data)}`);const matchesQuery=haystack.includes(searchable(query.trim()));const matchesFilter=filter==="all"||(filter==="published"&&item.visible)||(filter==="hidden"&&!item.visible)||(filter==="featured"&&item.data.featured===true)||(filter==="other"&&item.data.featured!==true);return matchesQuery&&matchesFilter}),[orderedItems,query,filter]);
  async function updateItem(item:Item,changes:Partial<Item>){if(busy)return;const updated={...item,...changes,data:changes.data||item.data};setBusy(`item-${item.id}`);setError("");try{if(!item.visible&&updated.visible&&!(await publicationAllowed(updated)))return;const saved=await request(`/api/v1/admin/content/${section}/${item.id}`,{method:"PUT",body:JSON.stringify({slug:updated.slug,data:updated.data,sort_order:updated.sort_order,visible:updated.visible})}) as Item;setItems(current=>current.map(entry=>entry.id===item.id?saved:entry));flash("Değişiklik kaydedildi.")}catch(e){setError((e as Error).message)}finally{setBusy("")}}
  async function moveItem(item:Item,direction:-1|1){const index=orderedItems.findIndex(entry=>entry.id===item.id);const targetIndex=index+direction;if(targetIndex<0||targetIndex>=orderedItems.length)return;const reordered=[...orderedItems];[reordered[index],reordered[targetIndex]]=[reordered[targetIndex],reordered[index]];const normalized=reordered.map((entry,position)=>({...entry,sort_order:position+1}));setBusy(`move-${item.id}`);setError("");setItems(normalized);try{await request(`/api/v1/admin/content/${section}/reorder`,{method:"PUT",body:JSON.stringify({ids:normalized.map(entry=>entry.id)})});flash("Sıralama güncellendi.")}catch(e){setItems(items);setError((e as Error).message)}finally{setBusy("")}}
  if(authenticated===null)return <div className="offline">Yükleniyor…</div>;
  if(!authenticated)return <LoginForm login={login} setLogin={setLogin} error={error} onSubmit={signIn}/>;
  return <main className="admin-shell" aria-busy={loading||saving||Boolean(uploading)||Boolean(busy)}>
    <header className="admin-bar">
      <div className="admin-brand"><Image src="/brand/ggu.png" width={48} height={48} alt=""/><span><strong>Gökçe Güler</strong><small>Portfolyo yönetimi</small></span></div>
      <div className="admin-bar-actions"><a className="admin-site-link" href="/tr" target="_blank" rel="noreferrer">Siteyi görüntüle ↗</a><button className="secondary" onClick={logout}>Çıkış</button></div>
    </header>
    <div className="admin-layout">
      <nav className="admin-nav">
        <button disabled={saving||Boolean(uploading)||Boolean(busy)} className={section==="dashboard"?"active":""} onClick={()=>chooseSection("dashboard")}>Ana sayfa</button>
        {Object.entries(schemas).map(([key,value])=><button disabled={saving||Boolean(uploading)||Boolean(busy)} key={key} className={section===key?"active":""} onClick={()=>chooseSection(key)}>{value.label}</button>)}
        <button disabled={saving||Boolean(uploading)||Boolean(busy)} className={section==="settings"?"active":""} onClick={()=>chooseSection("settings")}>Site ve marka</button>
        <button disabled={saving||Boolean(uploading)||Boolean(busy)} className={section==="cv-import"?"active":""} onClick={()=>chooseSection("cv-import")}>CV içe aktar</button>
      </nav>
      <section className="admin-main">
        {section!=="dashboard"&&error&&<div className="error" role="alert" style={{marginBottom:16}}>{error}</div>}
        {notice&&<div className="notice" role="status">{notice}</div>}
        {loading?<div className="admin-section-loading" role="status">İçerikler yükleniyor…</div>:section==="dashboard"?<AnalyticsDashboard request={request} onOpenIssue={openHealthIssue}/>:
          section==="cv-import"?<CvImport request={request}/>:
          section==="settings"?
          <SettingsForm settings={settings} setSettings={setSettings} setDirty={setDirty} uploadForSetting={uploadForSetting} languageTab={languageTab} setLanguageTab={setLanguageTab} dirty={dirty} saving={saving} uploading={uploading} onSubmit={saveSettings}/>:
          editing?
          <ContentEditor editing={editing} setEditing={setEditing} setDirty={setDirty} schema={schema} section={section} languageTab={languageTab} setLanguageTab={setLanguageTab} saving={saving} uploading={uploading} dirty={dirty} healthIssues={editHealth} updateField={updateField} uploadForItem={uploadForItem} onSubmit={saveItem} onCancel={cancelEditor}/>:
          <ContentList label={schema.label} section={section} schemaTitle={schema.title} totalCount={items.length} visibleItems={visibleItems} orderedItems={orderedItems} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} busy={busy} onNew={()=>openEditor(blank)} onEdit={openEditor} onDelete={setDeleteTarget} onUpdate={updateItem} onMove={moveItem}/>}
        {deleteTarget&&<DeleteDialog target={deleteTarget} schemaTitle={schema?.title||""} deleting={busy===`item-${deleteTarget.id}`} onCancel={()=>setDeleteTarget(null)} onConfirm={confirmDelete}/>}
      </section>
    </div>
  </main>;
}
