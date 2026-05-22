import { NextResponse } from "next/server";

import { createProductBundle, parseProductPayload } from "@/lib/product-admin";
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
    const payload = parseProductPayload(await request.json());
    const productId = await createProductBundle(client, payload);

    return NextResponse.json({ ok: true, productId });
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
