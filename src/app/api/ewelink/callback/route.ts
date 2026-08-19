import { NextResponse } from "next/server";
import { exchangeEweLinkCode } from "@/lib/ewelink";
import { prisma } from "@/lib/prisma";

// GET /api/ewelink/callback — eWeLink redirects here after the user approves access.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const region = url.searchParams.get("region") ?? "eu";

  if (!code) {
    return NextResponse.redirect(`${url.origin}/settings?ewelinkError=1`);
  }

  const redirectUri = `${url.origin}/api/ewelink/callback`;

  try {
    const result = await exchangeEweLinkCode(code, redirectUri, region);
    const { accessToken, refreshToken } = result.data;

    const existing = await prisma.eweLinkConnection.findFirst();
    const data = {
      accessToken,
      refreshToken,
      region,
      // eWeLink access tokens are valid for 30 days.
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    if (existing) {
      await prisma.eweLinkConnection.update({ where: { id: existing.id }, data });
    } else {
      await prisma.eweLinkConnection.create({ data });
    }

    return NextResponse.redirect(`${url.origin}/settings?ewelinkConnected=1`);
  } catch (error) {
    console.error("eWeLink OAuth callback failed", error);
    return NextResponse.redirect(`${url.origin}/settings?ewelinkError=1`);
  }
}
