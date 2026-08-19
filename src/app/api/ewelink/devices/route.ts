import { NextResponse } from "next/server";
import { eweLinkFetch, getEweLinkConnection } from "@/lib/ewelink";

export type EweLinkDevice = {
  id: string;
  name: string;
  online: boolean;
  on: boolean | null;
};

// GET /api/ewelink/devices — every device on the connected eWeLink account.
export async function GET() {
  const connection = await getEweLinkConnection();
  if (!connection) {
    return NextResponse.json({ devices: [], connected: false });
  }

  const res = await eweLinkFetch("/v2/device/thing");
  const data = (await res.json()) as {
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

  return NextResponse.json({ devices, connected: true });
}
