import { NextResponse } from "next/server";
import { getEweLinkAuthorizeUrl } from "@/lib/ewelink";

// GET /api/ewelink/connect — redirects the browser into eWeLink's OAuth consent page.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/ewelink/callback`;
  const authorizeUrl = getEweLinkAuthorizeUrl(redirectUri, "connect");
  return NextResponse.redirect(authorizeUrl);
}
