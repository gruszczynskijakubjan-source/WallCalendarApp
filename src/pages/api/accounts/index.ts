import type { NextApiRequest, NextApiResponse } from "next";
import { getLinkedGoogleAccounts } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const accounts = await getLinkedGoogleAccounts();
  return res.status(200).json(
    accounts.map((a) => ({
      id: a.id,
      name: a.user.name,
      email: a.user.email,
      // Custom uploads are stored as base64 in the DB and can be several MB
      // — serve them through a dedicated image endpoint (cacheable, and not
      // duplicated inline in this JSON payload) instead of the raw data URL.
      image: a.user.customImage ? `/api/accounts/${a.id}/photo-file` : a.user.image,
      householdRole: a.user.householdRole,
    })),
  );
}
