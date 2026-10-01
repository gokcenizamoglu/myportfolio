"use client";
import {Item} from "./schema";

export default function ContentRow({item,title,section,busy,isFirst,isLast,onMoveUp,onMoveDown,onToggleVisible,onToggleFeatured,onEdit,onDelete}:{
  item:Item;
  title:string;
  section:string;
  busy:boolean;
  isFirst:boolean;
  isLast:boolean;
  onMoveUp:()=>void;
  onMoveDown:()=>void;
  onToggleVisible:()=>void;
  onToggleFeatured:()=>void;
  onEdit:()=>void;
  onDelete:()=>void;
}){
  return <article className={`admin-row admin-content-row${item.visible?"":" is-hidden"}`} aria-busy={busy}>
    <div className="admin-order-controls">
      <button type="button" aria-label={`${title} yukarı taşı`} disabled={busy||isFirst} onClick={onMoveUp}>↑</button>
      <span>{item.sort_order}</span>
      <button type="button" aria-label={`${title} aşağı taşı`} disabled={busy||isLast} onClick={onMoveDown}>↓</button>
    </div>
    <div className="admin-row-visual" aria-hidden="true"><span>{title.charAt(0).toLocaleUpperCase("tr")}</span></div>
    <div className="admin-row-copy"><strong>{title}</strong><small>{item.slug}</small><div className="admin-badges"><span className={item.visible?"is-live":"is-draft"}>{busy?"Güncelleniyor…":item.visible?"Yayında":"Gizli"}</span>{section==="projects"&&<span>{item.data.featured===true?"Öne çıkan":"Diğer çalışma"}</span>}</div></div>
    <div className="admin-quick-actions">
      <label><input type="checkbox" checked={item.visible} disabled={busy} onChange={onToggleVisible}/><span>Yayında</span></label>
      {section==="projects"&&<label><input type="checkbox" checked={item.data.featured===true} disabled={busy} onChange={onToggleFeatured}/><span>Öne çıkan</span></label>}
    </div>
    <div className="row-actions"><button className="secondary" disabled={busy} onClick={onEdit}>Düzenle</button><button className="danger" disabled={busy} onClick={onDelete}>Sil</button></div>
  </article>;
}
