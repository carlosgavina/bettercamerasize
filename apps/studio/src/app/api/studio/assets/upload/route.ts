import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const PRODUCT_ASSETS_BUCKET = "product-assets";

export async function POST(request: Request) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Local Supabase admin client is not configured." },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const productId = parseRequiredFormValue(formData.get("productId"), "Product is required.");
    const assetView = parseRequiredFormValue(formData.get("assetView"), "Asset view is required.");
    const assetRole = parseRequiredFormValue(formData.get("assetRole"), "Asset role is required.");
    const lensHoodState = parseRequiredFormValue(
      formData.get("lensHoodState"),
      "Lens hood state is required.",
    );

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "Image file is required." },
        { status: 400 },
      );
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return NextResponse.json(
        { ok: false, message: "Only PNG, JPEG, and WebP images are supported." },
        { status: 400 },
      );
    }

    const { data: product, error: productError } = await client
      .schema("catalog")
      .from("products")
      .select("slug")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      throw new Error(productError?.message ?? "Product not found.");
    }

    const extension = getExtension(file);
    const storagePath = [
      product.slug,
      assetView,
      assetRole,
      lensHoodState,
      `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${extension}`,
    ].join("/");

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await client.storage
      .from(PRODUCT_ASSETS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    return NextResponse.json({
      ok: true,
      storageBucket: PRODUCT_ASSETS_BUCKET,
      storagePath,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown upload failure",
      },
      { status: 400 },
    );
  }
}

function parseRequiredFormValue(value: FormDataEntryValue | null, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim();
}

function getExtension(file: File) {
  if (file.type === "image/jpeg") {
    return "jpg";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "png";
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "asset";
}
