import type { NextApiRequest, NextApiResponse } from "next";
import { eweLinkFetch, getEweLinkConnection } from "@/lib/ewelink";

export type EweLinkDevice = {
  id: string;
  name: string;
  online: boolean;
  on: boolean | null;
};

// GET /api/ewelink/devices — every device on the connected eWeLink account.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const connection = await getEweLinkConnection();
  if (!connection) {
    return res.status(200).json({ devices: [], connected: false });
  }

  const apiRes = await eweLinkFetch("/v2/device/thing");
  const data = (await apiRes.json()) as {
    data: {
      thingList: {
        itemData: {
          deviceid: string;
          name: string;
          online: boolean;
          params?: { switch?: string };
        };
      }[];
    };
  };

  const devices: EweLinkDevice[] = data.data.thingList.map(({ itemData }) => ({
    id: itemData.deviceid,
    name: itemData.name,
    online: itemData.online,
    on: itemData.params?.switch ? itemData.params.switch === "on" : null,
  }));

  return res.status(200).json({ devices, connected: true });
}
