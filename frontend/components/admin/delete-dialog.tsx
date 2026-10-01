"use client";
import {Item} from "./schema";

export default function DeleteDialog({target,schemaTitle,deleting,onCancel,onConfirm}:{target:Item;schemaTitle:string;deleting:boolean;onCancel:()=>void;onConfirm:()=>void}){
  return <div className="admin-dialog-backdrop" role="presentation" onMouseDown={onCancel}><div className="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-delete-title" onMouseDown={event=>event.stopPropagation()}><span className="admin-dialog-mark" aria-hidden="true">!</span><h2 id="admin-delete-title">Kaydı sil?</h2><p><strong>{String(target.data[schemaTitle]||target.slug)}</strong> kalıcı olarak silinecek.</p><div className="editor-actions"><button type="button" className="secondary" onClick={onCancel}>Vazgeç</button><button type="button" className="danger" disabled={deleting} onClick={onConfirm}>{deleting?"Siliniyor…":"Sil"}</button></div></div></div>;
}
