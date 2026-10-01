"use client";
import {Change,Decision,FieldDiff,settingLabel} from "./types";

export function SettingCard({diff,decision,done,value,onValue,onDecision}:{diff:FieldDiff;decision:Decision;done:boolean;value:string;onValue:(value:string)=>void;onDecision:(decision:Decision)=>void}){
  return <div className={`cv-card cv-setting-card ${decision}${done?" done":""}`}>
    <div className="cv-card-head">
      <span className="cv-badge cv-update">AYAR</span>
      <strong>{settingLabel[diff.field]||diff.field}</strong>
      {done&&<span className="cv-badge cv-done-tag">uygulandı</span>}
      {!done&&decision==="accept"&&<span className="cv-badge cv-accepted-tag">kabul edildi</span>}
      {!done&&decision==="skip"&&<span className="cv-badge cv-skipped-tag">atlanacak</span>}
      {!done&&decision==="pending"&&<span className="cv-badge cv-pending-tag">bekliyor</span>}
      <div className="cv-card-actions">
        <button type="button" aria-pressed={decision==="accept"} disabled={done} className={decision==="accept"?"primary":"secondary"} onClick={()=>onDecision("accept")}>Kabul</button>
        <button type="button" aria-pressed={decision==="skip"} disabled={done} className={decision==="skip"?"danger":"secondary"} onClick={()=>onDecision("skip")}>Atla</button>
      </div>
    </div>
    {diff.old&&<div className="cv-old">- {diff.old}</div>}
    <textarea className="cv-new" aria-label={settingLabel[diff.field]||diff.field} disabled={done} value={value} onChange={e=>onValue(e.target.value)}/>
    {diff.auto_translated&&<span className="cv-flag">otomatik çeviri</span>}
  </div>;
}

export function ChangeCard({change,index,decision,done,slug,onSlug,onDecision,valueFor,onEdit}:{change:Change;slug:string;onSlug:(v:string)=>void;index:number;decision:Decision;done:boolean;onDecision:(d:Decision)=>void;valueFor:(i:number,d:FieldDiff)=>string;onEdit:(i:number,field:string,value:string)=>void}){
  const visible=change.field_diffs.filter(d=>d.changed);
  return <div className={`cv-card ${decision}${done?" done":""}`}>
    <div className="cv-card-head">
      <span className={`cv-badge cv-${change.action}`}>{change.action==="create"?"YENİ":"GÜNCELLEME"}</span>
      <input className="cv-slug" aria-label="slug" disabled={done} value={slug} onChange={e=>onSlug(e.target.value)}/>
      {done&&<span className="cv-badge cv-done-tag">uygulandı</span>}
      {!done&&decision==="accept"&&<span className="cv-badge cv-accepted-tag">kabul edildi</span>}
      {!done&&decision==="skip"&&<span className="cv-badge cv-skipped-tag">atlanacak</span>}
      {!done&&decision==="pending"&&<span className="cv-badge cv-pending-tag">bekliyor</span>}
      <div className="cv-card-actions">
        <button type="button" aria-pressed={decision==="accept"} disabled={done} className={decision==="accept"?"primary":"secondary"} onClick={()=>onDecision("accept")}>Kabul</button>
        <button type="button" aria-pressed={decision==="skip"} disabled={done} className={decision==="skip"?"danger":"secondary"} onClick={()=>onDecision("skip")}>Atla</button>
      </div>
    </div>
    <div className="cv-fields">
      {visible.map(diff=><div key={diff.field} className="cv-field">
        <div className="cv-field-key">{diff.field}{diff.auto_translated&&<span className="cv-flag">otomatik çeviri</span>}</div>
        {change.action==="update"&&diff.old&&<div className="cv-old">- {diff.old}</div>}
        <textarea className="cv-new" aria-label={diff.field} disabled={done} value={valueFor(index,diff)} onChange={e=>onEdit(index,diff.field,e.target.value)}/>
      </div>)}
    </div>
  </div>;
}
