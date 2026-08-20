import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Sent as a base64 data URL in the JSON body (up to ~27MB once base64-encoded
// from a 20MB image), well past Next's 1MB API body default.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "30mb",
    },
  },
};

// PUT /api/accounts/:id/photo — :id is the Account id (as returned by /api/accounts)
async function put(req: NextApiRequest, res: NextApiResponse) {
  const accountId = req.query.id as string;

  const dataUrl = req.body?.dataUrl;
  if (!dataUrl || typeof dataUrl !== "string") {
    return res.status(400).json({ error: "dataUrl is required" });
  }

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match || !ALLOWED_TYPES.includes(match[1].toLowerCase())) {
    return res.status(400).json({ error: "Nieobsługiwany typ obrazu" });
  }

  const approxBytes = (match[2].length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) {
    return res.status(400).json({ error: "Obraz jest za duży (max 20 MB)" });
  }

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    return res.status(404).json({ error: "Nie znaleziono konta" });
  }

  await prisma.user.update({
    where: { id: account.userId },
    data: { customImage: dataUrl },
  });

  return res.status(200).json({ ok: true });
}

// DELETE /api/accounts/:id/photo — resets to the Google profile picture
async function del(req: NextApiRequest, res: NextApiResponse) {
  const accountId = req.query.id as string;

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    return res.status(404).json({ error: "Nie znaleziono konta" });
  }

  await prisma.user.update({
    where: { id: account.userId },
    data: { customImage: null },
  });

  return res.status(200).json({ ok: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PUT") return put(req, res);
  if (req.method === "DELETE") return del(req, res);
  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).end();
}
