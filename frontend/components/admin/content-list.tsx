"use client";
import {Item} from "./schema";
import ContentRow from "./content-row";

export default function ContentList({label,section,schemaTitle,totalCount,visibleItems,orderedItems,query,setQuery,filter,setFilter,busy,onNew,onEdit,onDelete,onUpdate,onMove}:{
  label:string;
  section:string;
  schemaTitle:string;
  totalCount:number;
  visibleItems:Item[];
  orderedItems:Item[];
  query:string;
  setQuery:(value:string)=>void;
  filter:string;
  setFilter:(value:string)=>void;
  busy:string;
  onNew:()=>void;
  onEdit:(item:Item)=>void;
  onDelete:(item:Item)=>void;
  onUpdate:(item:Item,changes:Partial<Item>)=>void;
  onMove:(item:Item,direction:-1|1)=>void;
}){
  return <>
    <div className="toolbar admin-list-header">
      <div><h1>{label}</h1><p>{totalCount} kayıt</p></div>
      <button className="primary" onClick={onNew}>Yeni ekle</button>
    </div>
    <div className="admin-list-tools">
      <label className="admin-search"><span>İçerikte ara</span><input type="search" placeholder="Başlık, slug veya içerik…" value={query} onChange={event=>setQuery(event.target.value)}/></label>
      <label className="admin-filter"><span>Göster</span><select value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">Tüm kayıtlar</option><option value="published">Yayında</option><option value="hidden">Gizli</option>{section==="projects"&&<><option value="featured">Öne çıkanlar</option><option value="other">Diğer çalışmalar</option></>}</select></label>
    </div>
    <div className="admin-list-summary"><span>{visibleItems.length} sonuç</span><span>Oklarla sıralayabilir, durumları kart üzerinden değiştirebilirsin.</span></div>
    <div className="admin-list">{visibleItems.map(item=>{
      const orderIndex=orderedItems.findIndex(entry=>entry.id===item.id);
      const title=String(item.data[schemaTitle]||item.data[schemaTitle.replace("_tr","")]||item.slug);
      const itemBusy=busy===`item-${item.id}`||busy===`move-${item.id}`;
      return <ContentRow key={item.id} item={item} title={title} section={section} busy={itemBusy} isFirst={orderIndex===0} isLast={orderIndex===orderedItems.length-1} onMoveUp={()=>onMove(item,-1)} onMoveDown={()=>onMove(item,1)} onToggleVisible={()=>onUpdate(item,{visible:!item.visible})} onToggleFeatured={()=>onUpdate(item,{data:{...item.data,featured:item.data.featured!==true}})} onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item)}/>;
    })}{visibleItems.length===0&&<div className="admin-empty"><strong>Sonuç bulunamadı.</strong><span>Arama metnini veya filtreyi değiştirebilirsin.</span></div>}</div>
  </>;
}
