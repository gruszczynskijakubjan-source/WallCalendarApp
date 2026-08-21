import { NextResponse } from "next/server";
import { getLinkedGoogleAccounts } from "@/lib/google";

export async function GET() {
  const accounts = await getLinkedGoogleAccounts();
  return NextResponse.json(
    accounts.map((a) => ({
      id: a.id,
      name: a.user.name,
      email: a.user.email,
      // Custom uploads are stored as base64 in the DB and can be several MB
      // — serve them through a dedicated, cacheable image endpoint instead
      // of the raw data URL inlined in this JSON response.
      image: a.user.customImage ? `/api/accounts/${a.id}/photo-file` : a.user.image,
      householdRole: a.user.householdRole,
    })),
  );
}
