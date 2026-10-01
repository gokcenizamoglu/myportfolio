"use client";
import {FormEvent} from "react";

export type Credentials={username:string;password:string};

export default function LoginForm({login,setLogin,error,onSubmit}:{login:Credentials;setLogin:(value:Credentials)=>void;error:string;onSubmit:(event:FormEvent)=>void}){
  return <div className="login"><form onSubmit={onSubmit}><img src="/brand/logo-script.svg" alt="Gökçe Güler"/><h1>Portfolyo yönetimi</h1>{error&&<div className="error">{error}</div>}<input aria-label="Kullanıcı adı" placeholder="Kullanıcı adı" value={login.username} onChange={e=>setLogin({...login,username:e.target.value})}/><input aria-label="Parola" type="password" placeholder="Parola" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/><button className="primary">Giriş yap</button></form></div>;
}
