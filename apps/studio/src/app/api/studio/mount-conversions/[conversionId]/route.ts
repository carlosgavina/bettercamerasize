import { NextResponse } from "next/server";

import {
  deleteMountConversionBundle,
  parseMountConversionPayload,
  updateMountConversionBundle,
} from "@/lib/mount-conversion-admin";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    conversionId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Local Supabase admin client is not configured." },
      { status: 500 },
    );
  }

  try {
    const { conversionId } = await context.params;
    const payload = parseMountConversionPayload(await request.json());

    await updateMountConversionBundle(client, conversionId, payload);

    return NextResponse.json({ ok: true });
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

export async function DELETE(_request: Request, context: RouteContext) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Local Supabase admin client is not configured." },
      { status: 500 },
    );
  }

  try {
    const { conversionId } = await context.params;

    await deleteMountConversionBundle(client, conversionId);

    return NextResponse.json({ ok: true });
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
