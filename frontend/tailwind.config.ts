import type { Config } from "tailwindcss";
export default {content:["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}"],theme:{extend:{colors:{paper:"var(--paper)",ink:"var(--ink)",muted:"var(--muted)",line:"var(--line)",accent:"var(--accent)"},fontFamily:{sans:["var(--font-sans)"],serif:["var(--font-serif)"]}}},plugins:[]} satisfies Config;
