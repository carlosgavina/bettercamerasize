import { NextResponse } from "next/server";

import {
  createMountConversionBundle,
  parseMountConversionPayload,
} from "@/lib/mount-conversion-admin";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Local Supabase admin client is not configured." },
      { status: 500 },
    );
  }

  try {
    const payload = parseMountConversionPayload(await request.json());
    const conversionId = await createMountConversionBundle(client, payload);

    return NextResponse.json({ ok: true, conversionId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown mutation failure",
      },
      { status: 400 },
    );
  }
}
