import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
export function middleware(request:NextRequest){
  if(request.nextUrl.pathname==="/")return NextResponse.redirect(new URL("/tr",request.url));
  // Expose the pathname to the root layout so it can emit the correct
  // <html lang> on the first server render, rather than only correcting it on
  // the client after hydration.
  const headers=new Headers(request.headers);
  headers.set("x-pathname",request.nextUrl.pathname);
  return NextResponse.next({request:{headers}});
}
export const config={matcher:["/((?!_next/|favicon.ico|brand/|uploads/).*)"]};
