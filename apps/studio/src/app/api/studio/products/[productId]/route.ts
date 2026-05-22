import { NextResponse } from "next/server";

import {
  deleteProductBundle,
  parseProductPayload,
  updateProductBundle,
} from "@/lib/product-admin";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    productId: string;
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
    const { productId } = await context.params;
    const payload = parseProductPayload(await request.json());

    await updateProductBundle(client, productId, payload);

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
    const { productId } = await context.params;

    await deleteProductBundle(client, productId);

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
