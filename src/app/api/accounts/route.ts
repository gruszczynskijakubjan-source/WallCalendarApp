import { NextResponse } from "next/server";
import { getLinkedGoogleAccounts } from "@/lib/google";

export async function GET() {
  const accounts = await getLinkedGoogleAccounts();
  return NextResponse.json(
    accounts.map((a) => ({
      id: a.id,
      name: a.user.name,
      email: a.user.email,
      image: a.user.customImage ?? a.user.image,
      householdRole: a.user.householdRole,
    })),
  );
}
