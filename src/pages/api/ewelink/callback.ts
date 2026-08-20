import type { NextApiRequest, NextApiResponse } from "next";
import { exchangeEweLinkCode } from "@/lib/ewelink";
import { prisma } from "@/lib/prisma";

function getOrigin(req: NextApiRequest) {
  const protocol = req.headers["x-forwarded-proto"] ?? "http";
  return `${protocol}://${req.headers.host}`;
}

// GET /api/ewelink/callback — eWeLink redirects here after the user approves access.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const origin = getOrigin(req);
  const code = req.query.code as string | undefined;
  const region = (req.query.region as string) ?? "eu";

  if (!code) {
    return res.redirect(302, `${origin}/settings?ewelinkError=1`);
  }

  const redirectUri = `${origin}/api/ewelink/callback`;

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

    return res.redirect(302, `${origin}/settings?ewelinkConnected=1`);
  } catch (error) {
    console.error("eWeLink OAuth callback failed", error);
    return res.redirect(302, `${origin}/settings?ewelinkError=1`);
  }
}
