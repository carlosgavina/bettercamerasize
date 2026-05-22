import { NextResponse } from "next/server";

import { deleteAsset, parseAssetPayload, updateAsset } from "@/lib/asset-admin";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    assetId: string;
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
    const { assetId } = await context.params;
    const payload = parseAssetPayload(await request.json());

    await updateAsset(client, assetId, payload);

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
    const { assetId } = await context.params;

    await deleteAsset(client, assetId);

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
