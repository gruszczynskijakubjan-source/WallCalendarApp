import type { NextApiRequest, NextApiResponse } from "next";
import { eweLinkFetch } from "@/lib/ewelink";

// PATCH /api/ewelink/devices/:id/toggle — turn a single-switch device on/off.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).end();
  }

  const id = req.query.id as string;
  const { on } = req.body as { on: boolean };

  await eweLinkFetch("/v2/device/thing/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: 1,
      id,
      params: { switch: on ? "on" : "off" },
    }),
  });

  return res.status(200).json({ ok: true });
}
