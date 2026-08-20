import type { NextApiRequest, NextApiResponse } from "next";
import { getEweLinkAuthorizeUrl } from "@/lib/ewelink";

function getOrigin(req: NextApiRequest) {
  const protocol = req.headers["x-forwarded-proto"] ?? "http";
  return `${protocol}://${req.headers.host}`;
}

// GET /api/ewelink/connect — redirects the browser into eWeLink's OAuth consent page.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const origin = getOrigin(req);
  const redirectUri = `${origin}/api/ewelink/callback`;
  const authorizeUrl = getEweLinkAuthorizeUrl(redirectUri, "connect");
  return res.redirect(302, authorizeUrl);
}
