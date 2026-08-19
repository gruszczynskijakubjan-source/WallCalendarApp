import { prisma } from "@/lib/prisma";

const TRELLO_API = "https://api.trello.com/1";

export async function getTrelloConnection() {
  return prisma.trelloConnection.findFirst();
}

function authParams(apiKey: string, token: string) {
  return `key=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(token)}`;
}

export async function trelloFetch(
  apiKey: string,
  token: string,
  path: string,
  init?: RequestInit,
) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${TRELLO_API}${path}${separator}${authParams(apiKey, token)}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Trello API error ${res.status}: ${body}`);
  }
  return res;
}
