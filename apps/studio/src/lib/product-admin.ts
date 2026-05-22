import type { SupabaseClient } from "@supabase/supabase-js";

export type ProductKind = "camera_body" | "lens" | "adapter";

export type ProductMutationInput = {
  productType: ProductKind;
  brandId: string;
  systemId: string | null;
  slug: string;
  name: string;
  displayName: string;
  status: string;
  mountId: string | null;
  bodyStyle: string | null;
  sensorFormatId: string | null;
  lensKind: string | null;
  imageCircleFormatId: string | null;
  adapterType: string | null;
  numbers: Record<string, number | null>;
};

type MutationPayload = {
  productType?: unknown;
  brandId?: unknown;
  systemId?: unknown;
  slug?: unknown;
  name?: unknown;
  displayName?: unknown;
  status?: unknown;
  mountId?: unknown;
  bodyStyle?: unknown;
  sensorFormatId?: unknown;
  lensKind?: unknown;
  imageCircleFormatId?: unknown;
  adapterType?: unknown;
  numbers?: unknown;
};

const PRODUCT_KINDS = new Set<ProductKind>(["camera_body", "lens", "adapter"]);
const STATUSES = new Set(["draft", "active", "discontinued", "archived"]);
const BODY_STYLES = new Set([
  "mirrorless",
  "dslr",
  "rangefinder",
  "compact",
  "medium_format",
  "fixed_lens",
  "cine",
]);
const LENS_KINDS = new Set(["prime", "zoom", "teleconverter", "extender"]);
const ADAPTER_TYPES = new Set([
  "mechanical",
  "electronic",
  "optical",
  "teleconverter",
  "speed_booster",
]);

export function parseProductPayload(payload: MutationPayload): ProductMutationInput {
  const productType = parseEnum(payload.productType, PRODUCT_KINDS, "Product type is required.");
  const name = parseRequiredString(payload.name, "Product name is required.");
  const displayName = parseOptionalString(payload.displayName) ?? name;
  const slug = normalizeSlug(parseOptionalString(payload.slug) ?? displayName);
  const status = parseEnum(payload.status, STATUSES, "Status is required.");
  const numbers =
    payload.numbers && typeof payload.numbers === "object" && !Array.isArray(payload.numbers)
      ? Object.fromEntries(
          Object.entries(payload.numbers).map(([key, value]) => [
            key,
            parseNullableNumber(value, key),
          ]),
        )
      : {};

  return {
    productType,
    brandId: parseRequiredString(payload.brandId, "Brand is required."),
    systemId: parseNullableString(payload.systemId),
    slug,
    name,
    displayName,
    status,
    mountId: parseNullableString(payload.mountId),
    bodyStyle:
      productType === "camera_body"
        ? parseEnum(payload.bodyStyle, BODY_STYLES, "Body style is required.")
        : null,
    sensorFormatId:
      productType === "camera_body"
        ? parseNullableString(payload.sensorFormatId)
        : null,
    lensKind:
      productType === "lens"
        ? parseEnum(payload.lensKind, LENS_KINDS, "Lens kind is required.")
        : null,
    imageCircleFormatId:
      productType === "lens"
        ? parseNullableString(payload.imageCircleFormatId)
        : null,
    adapterType:
      productType === "adapter"
        ? parseEnum(payload.adapterType, ADAPTER_TYPES, "Adapter type is required.")
        : null,
    numbers,
  };
}

export async function createProductBundle(
  client: SupabaseClient,
  input: ProductMutationInput,
) {
  const { data: product, error: insertError } = await client
    .schema("catalog")
    .from("products")
    .insert({
      product_type: input.productType,
      brand_id: input.brandId,
      system_id: input.systemId,
      slug: input.slug,
      name: input.name,
      display_name: input.displayName,
      status: input.status,
    })
    .select("id")
    .single();

  if (insertError || !product) {
    throw new Error(insertError?.message ?? "Failed to create product.");
  }

  await upsertSubtype(client, product.id, input);
  await syncNativeMount(client, product.id, input);

  return product.id;
}

export async function updateProductBundle(
  client: SupabaseClient,
  productId: string,
  input: ProductMutationInput,
) {
  const { error: updateError } = await client
    .schema("catalog")
    .from("products")
    .update({
      brand_id: input.brandId,
      system_id: input.systemId,
      slug: input.slug,
      name: input.name,
      display_name: input.displayName,
      status: input.status,
    })
    .eq("id", productId)
    .eq("product_type", input.productType);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await upsertSubtype(client, productId, input);
  await syncNativeMount(client, productId, input);
}

export async function deleteProductBundle(
  client: SupabaseClient,
  productId: string,
) {
  const { error } = await client
    .schema("catalog")
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertSubtype(
  client: SupabaseClient,
  productId: string,
  input: ProductMutationInput,
) {
  if (input.productType === "camera_body") {
    const { error } = await client.schema("catalog").from("camera_bodies").upsert(
      {
        product_id: productId,
        body_style: input.bodyStyle,
        sensor_format_id: input.sensorFormatId,
        width_mm: input.numbers.widthMm ?? null,
        height_mm: input.numbers.heightMm ?? null,
        depth_mm: input.numbers.depthMm ?? null,
        weight_g: input.numbers.weightG ?? null,
      },
      { onConflict: "product_id" },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (input.productType === "lens") {
    const { error } = await client.schema("catalog").from("lenses").upsert(
      {
        product_id: productId,
        lens_kind: input.lensKind,
        image_circle_format_id: input.imageCircleFormatId,
        focal_length_min_mm: input.numbers.focalLengthMinMm ?? null,
        focal_length_max_mm: input.numbers.focalLengthMaxMm ?? null,
        max_aperture_wide: input.numbers.maxApertureWide ?? null,
        max_aperture_tele: input.numbers.maxApertureTele ?? null,
        diameter_mm: input.numbers.diameterMm ?? null,
        length_mm: input.numbers.lengthMm ?? null,
        weight_g: input.numbers.weightG ?? null,
        filter_thread_mm: input.numbers.filterThreadMm ?? null,
      },
      { onConflict: "product_id" },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (input.productType === "adapter") {
    const { error } = await client.schema("catalog").from("adapter_specs").upsert(
      {
        product_id: productId,
        adapter_type: input.adapterType,
        adds_length_mm: input.numbers.addsLengthMm ?? null,
        adds_weight_g: input.numbers.addsWeightG ?? null,
      },
      { onConflict: "product_id" },
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function syncNativeMount(
  client: SupabaseClient,
  productId: string,
  input: ProductMutationInput,
) {
  if (input.productType === "adapter") {
    return;
  }

  const table = input.productType === "camera_body" ? "body_mounts" : "lens_mounts";
  const productColumn =
    input.productType === "camera_body" ? "body_product_id" : "lens_product_id";

  const { error: deleteError } = await client
    .schema("catalog")
    .from(table)
    .delete()
    .eq(productColumn, productId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!input.mountId) {
    return;
  }

  const { error: insertError } = await client
    .schema("catalog")
    .from(table)
    .insert({
      [productColumn]: productId,
      mount_id: input.mountId,
      is_native: true,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

function parseRequiredString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim();
}

function parseNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function parseOptionalString(value: unknown) {
  return parseNullableString(value);
}

function parseEnum<T extends string>(value: unknown, allowedValues: Set<T>, message: string) {
  if (typeof value !== "string") {
    throw new Error(message);
  }

  const typedValue = value as T;

  if (!allowedValues.has(typedValue)) {
    throw new Error(message);
  }

  return typedValue;
}

function parseNullableNumber(value: unknown, label: string) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a positive number or blank.`);
  }

  return parsed;
}

function normalizeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("Slug is required.");
  }

  return slug;
}
