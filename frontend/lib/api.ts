import type { PortfolioData } from "./types";
export const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export async function getPortfolio():Promise<PortfolioData|null>{
  try { const response=await fetch(`${process.env.API_URL || apiBase}/api/v1/portfolio`,{cache:"no-store"}); if(!response.ok)return null; return response.json(); } catch { return null; }
}
