import Link from "next/link";
import Image from "next/image";

export default function NotFound(){return <main className="not-found-page"><Image src="/brand/ggu.png" width={220} height={220} alt="Gökçe Güler"/><p>404</p><h1>Bu sayfa bulunamadı.</h1><span>Aradığın içerik kaldırılmış, gizlenmiş veya adresi değişmiş olabilir.</span><Link href="/tr">Portfolyoya dön →</Link></main>}
