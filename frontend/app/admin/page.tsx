import AdminPanel from "@/components/admin-panel";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Portfolyo yönetimi",robots:{index:false,follow:false,nocache:true}};
export default function AdminPage(){return <AdminPanel/>}
