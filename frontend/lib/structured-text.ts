export type StructuredText={kind:"list"|"paragraphs";items:string[]};

// Content fields intentionally stay as plain text in the API. This keeps them
// portable while still allowing the admin to author simple, accessible lists.
export function structuredText(value:string):StructuredText{
  const text=value.trim();
  if(!text)return {kind:"paragraphs",items:[]};
  const hasBullets=/^\s*[-•*]\s*\S/u.test(text)||/\r?\n\s*[-•*]\s*\S/u.test(text);
  if(hasBullets){
    const items=text
      .split(/\r?\n|\s+(?=[-•*]\s*\S)/u)
      .map(item=>item.replace(/^\s*[-•*]\s*/u,"").trim())
      .filter(Boolean);
    return {kind:"list",items};
  }
  return {kind:"paragraphs",items:text.split(/\r?\n+/u).map(item=>item.trim()).filter(Boolean)};
}
