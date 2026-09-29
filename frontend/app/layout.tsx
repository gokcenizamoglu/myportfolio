import type { Metadata } from "next";
import { Raleway, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const raleway = Raleway({ subsets: ["latin", "latin-ext"], variable: "--font-raleway" });
const sourceSans = Source_Sans_3({ subsets: ["latin", "latin-ext"], variable: "--font-source-sans" });

export const metadata:Metadata={title:"Gökçe Güler — Full-Stack Software Engineer",description:"Software systems from architecture to production."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${raleway.variable} ${sourceSans.variable}`}>{children}</body></html>}
