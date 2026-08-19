import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// eWeLink (Coolkit Open Platform) OAuth2 + device API.
// Docs: https://dev.ewelink.cc/

const REGION_HOSTS: Record<string, string> = {
  cn: "https://cn-apia.coolkit.cn",
  as: "https://as-apia.coolkit.cc",
  us: "https://us-apia.coolkit.cc",
  eu: "https://eu-apia.coolkit.cc",
};

function apiHost(region: string) {
  return REGION_HOSTS[region] ?? REGION_HOSTS.eu;
}

/** eWeLink requires an HMAC-SHA256 signature of the JSON body, base64-encoded, in Authorization. */
function signBody(body: unknown, appSecret: string) {
  const payload = JSON.stringify(body ?? {});
  const hmac = crypto.createHmac("sha256", appSecret).update(payload).digest("base64");
  return { signature: hmac, payload };
}

export function getEweLinkAuthorizeUrl(redirectUri: string, state: string) {
  const appId = process.env.EWELINK_APP_ID;
  if (!appId) throw new Error("EWELINK_APP_ID is not configured");

  const seq = Date.now().toString();
  const params = new URLSearchParams({
    clientId: appId,
    seq,
    redirectUrl: redirectUri,
    state,
    nonce: crypto.randomBytes(8).toString("hex"),
    grantType: "authorization_code",
  });

  // The web authorize endpoint itself doesn't need a body signature — only
  // the token-exchange and device API calls do.
  return `https://c2ccdn.coolkit.cc/oauth/index.html?${params.toString()}`;
}

export async function exchangeEweLinkCode(code: string, redirectUri: string, region: string) {
  const appId = process.env.EWELINK_APP_ID;
  const appSecret = process.env.EWELINK_APP_SECRET;
  if (!appId || !appSecret) throw new Error("eWeLink credentials are not configured");

  const body = { clientId: appId, grantType: "authorization_code", code, redirectUrl: redirectUri };
  const { signature, payload } = signBody(body, appSecret);

  const res = await fetch(`${apiHost(region)}/v2/user/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Sign ${signature}`,
      "X-CK-Appid": appId,
    },
    body: payload,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`eWeLink token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    data: {
      accessToken: string;
      refreshToken: string;
      atExpiredTime: number;
      region: string;
    };
  }>;
}

export async function getEweLinkConnection() {
  return prisma.eweLinkConnection.findFirst();
}

/** Returns a valid access token for the stored connection, refreshing it first if it has expired. */
export async function getValidEweLinkToken() {
  const connection = await getEweLinkConnection();
  if (!connection) return null;

  const isExpired = connection.expiresAt.getTime() - 60_000 < Date.now();
  if (!isExpired) return connection;

  const appId = process.env.EWELINK_APP_ID;
  const appSecret = process.env.EWELINK_APP_SECRET;
  if (!appId || !appSecret) throw new Error("eWeLink credentials are not configured");

  const body = { rt: connection.refreshToken };
  const { signature, payload } = signBody(body, appSecret);

  const res = await fetch(`${apiHost(connection.region)}/v2/user/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Sign ${signature}`,
      "X-CK-Appid": appId,
    },
    body: payload,
  });

  if (!res.ok) throw new Error(`eWeLink token refresh failed: ${res.status}`);
  const data = (await res.json()) as {
    data: { at: string; rt: string };
  };

  const updated = await prisma.eweLinkConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: data.data.at,
      refreshToken: data.data.rt,
      // eWeLink access tokens are valid for 30 days.
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return updated;
}

export async function eweLinkFetch(path: string, init?: RequestInit) {
  const connection = await getValidEweLinkToken();
  if (!connection) throw new Error("eWeLink not connected");

  const appId = process.env.EWELINK_APP_ID;
  const res = await fetch(`${apiHost(connection.region)}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${connection.accessToken}`,
      "X-CK-Appid": appId ?? "",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`eWeLink API error ${res.status}: ${text}`);
  }
  return res;
}
