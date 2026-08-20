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
      image: a.user.customImage ?? a.user.image,
      householdRole: a.user.householdRole,
    })),
  );
}
