import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const client = getSupabaseAdminClient();

  if (!client) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing_env",
      },
      { status: 500 },
    );
  }

  const { count, error } = await client
    .schema("catalog")
    .from("products")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: "query_failed",
        message: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    productCount: count ?? 0,
  });
}
