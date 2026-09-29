import {notFound} from "next/navigation";
import {getPortfolio} from "@/lib/api";
import Portfolio from "@/components/portfolio";
export const dynamic="force-dynamic";
export default async function LocalizedPage({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(locale!=="tr"&&locale!=="en")notFound();
  return <Portfolio initialData={await getPortfolio()} locale={locale}/>;
}
