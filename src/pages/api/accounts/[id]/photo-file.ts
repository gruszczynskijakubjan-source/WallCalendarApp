import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// GET /api/accounts/:id/photo-file — streams the account's custom profile
// photo as a real image response, so it loads via <img src> and benefits
// from the browser's normal image cache, instead of being duplicated as a
// multi-MB base64 string inside every JSON response that references this
// account (accounts, tasks, calendar events) — which was large enough to
// crash older/low-memory devices.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const accountId = req.query.id as string;
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { user: { select: { customImage: true } } },
  });

  const dataUrl = account?.user.customImage;
  if (!dataUrl) {
    return res.status(404).end();
  }

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    return res.status(404).end();
  }

  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "private, max-age=3600");
  return res.status(200).send(buffer);
}
