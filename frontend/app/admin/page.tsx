import AdminPanel from "@/components/admin-panel";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Portfolyo yönetimi",description:"Gökçe Güler portfolyo içerik yönetimi.",robots:{index:false,follow:false,nocache:true}};
export default function AdminPage(){return <main><AdminPanel/></main>}
