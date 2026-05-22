import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    assetId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Local Supabase admin client is not configured." },
      { status: 500 },
    );
  }

  try {
    const { assetId } = await context.params;
    const { data: asset, error: assetError } = await client
      .schema("catalog")
      .from("product_assets")
      .select("storage_bucket, storage_path")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      throw new Error(assetError?.message ?? "Asset not found.");
    }

    const { data: file, error: downloadError } = await client.storage
      .from(asset.storage_bucket)
      .download(asset.storage_path);

    if (downloadError || !file) {
      throw new Error(downloadError?.message ?? "Asset file not found.");
    }

    return new Response(file, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": file.type || "application/octet-stream",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown asset failure",
      },
      { status: 404 },
    );
  }
}
