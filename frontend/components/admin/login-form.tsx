"use client";
import {FormEvent} from "react";
import Image from "next/image";

export type Credentials={username:string;password:string};

export default function LoginForm({login,setLogin,error,onSubmit}:{login:Credentials;setLogin:(value:Credentials)=>void;error:string;onSubmit:(event:FormEvent)=>void}){
  return <div className="login"><form onSubmit={onSubmit}><Image src="/brand/logo-script.svg" width={180} height={80} alt="Gökçe Güler"/><h1>Portfolyo yönetimi</h1>{error&&<div className="error" role="alert">{error}</div>}<label className="sr-only" htmlFor="admin-username">Kullanıcı adı</label><input id="admin-username" autoComplete="username" placeholder="Kullanıcı adı" value={login.username} onChange={e=>setLogin({...login,username:e.target.value})}/><label className="sr-only" htmlFor="admin-password">Parola</label><input id="admin-password" autoComplete="current-password" type="password" placeholder="Parola" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/><button className="primary">Giriş yap</button></form></div>;
}
