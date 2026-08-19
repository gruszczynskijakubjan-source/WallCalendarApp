import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS = 60;

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
}

/**
 * Returns an authenticated OAuth2 client for a given linked Google account,
 * refreshing and persisting the access token if it has expired.
 */
export async function getGoogleClientForAccount(accountId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account?.refresh_token) {
    throw new Error("Account not found or missing refresh token");
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  const isExpired =
    !account.expires_at ||
    account.expires_at - TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS < Date.now() / 1000;

  if (isExpired) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: credentials.access_token,
        expires_at: credentials.expiry_date
          ? Math.floor(credentials.expiry_date / 1000)
          : null,
      },
    });
  }

  return oauth2Client;
}

/** All linked Google accounts (i.e. both household members who connected Google). */
export async function getLinkedGoogleAccounts() {
  return prisma.account.findMany({
    where: { provider: "google" },
    include: { user: true },
  });
}

export async function getCalendarClient(accountId: string) {
  const auth = await getGoogleClientForAccount(accountId);
  return google.calendar({ version: "v3", auth });
}

export async function getTasksClient(accountId: string) {
  const auth = await getGoogleClientForAccount(accountId);
  return google.tasks({ version: "v1", auth });
}
