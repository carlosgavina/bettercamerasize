import type { SupabaseClient } from "@supabase/supabase-js";

export type AssetMutationInput = {
  productId: string;
  assetRole: string;
  assetView: string;
  lensHoodState: string;
  storageBucket: string;
  storagePath: string;
  sourceName: string | null;
  sourceUrl: string | null;
  licenseNotes: string | null;
  approvalStatus: string;
  backgroundRemoved: boolean;
  calibrated: boolean;
  pixelsPerMm: number | null;
};

type MutationPayload = {
  productId?: unknown;
  assetRole?: unknown;
  assetView?: unknown;
  lensHoodState?: unknown;
  storageBucket?: unknown;
  storagePath?: unknown;
  sourceName?: unknown;
  sourceUrl?: unknown;
  licenseNotes?: unknown;
  approvalStatus?: unknown;
  backgroundRemoved?: unknown;
  calibrated?: unknown;
  pixelsPerMm?: unknown;
};

const ASSET_ROLES = new Set([
  "reference",
  "calibrated_cutout",
  "thumbnail",
  "overlay",
]);
const ASSET_VIEWS = new Set([
  "front",
  "rear",
  "left",
  "right",
  "top",
  "bottom",
  "mount_front",
  "mount_rear",
  "three_quarter",
]);
const LENS_HOOD_STATES = new Set([
  "not_applicable",
  "unknown",
  "without_hood",
  "with_hood",
]);
const APPROVAL_STATUSES = new Set([
  "draft",
  "needs_review",
  "approved",
  "rejected",
]);

export function parseAssetPayload(payload: MutationPayload): AssetMutationInput {
  return {
    productId: parseRequiredString(payload.productId, "Product is required."),
    assetRole: parseEnum(payload.assetRole, ASSET_ROLES, "Asset role is required."),
    assetView: parseEnum(payload.assetView, ASSET_VIEWS, "Asset view is required."),
    lensHoodState: parseEnum(
      payload.lensHoodState,
      LENS_HOOD_STATES,
      "Lens hood state is required.",
    ),
    storageBucket: parseRequiredString(payload.storageBucket, "Storage bucket is required."),
    storagePath: parseRequiredString(payload.storagePath, "Storage path is required."),
    sourceName: parseNullableString(payload.sourceName),
    sourceUrl: parseNullableString(payload.sourceUrl),
    licenseNotes: parseNullableString(payload.licenseNotes),
    approvalStatus: parseEnum(
      payload.approvalStatus,
      APPROVAL_STATUSES,
      "Approval status is required.",
    ),
    backgroundRemoved: payload.backgroundRemoved === true,
    calibrated: payload.calibrated === true,
    pixelsPerMm: parseNullableNumber(payload.pixelsPerMm, "pixelsPerMm"),
  };
}

export async function createAsset(client: SupabaseClient, input: AssetMutationInput) {
  const { data, error } = await client
    .schema("catalog")
    .from("product_assets")
    .insert(toRecord(input))
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create asset.");
  }

  return data.id;
}

export async function updateAsset(
  client: SupabaseClient,
  assetId: string,
  input: AssetMutationInput,
) {
  const { error } = await client
    .schema("catalog")
    .from("product_assets")
    .update(toRecord(input))
    .eq("id", assetId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAsset(client: SupabaseClient, assetId: string) {
  const { error } = await client
    .schema("catalog")
    .from("product_assets")
    .delete()
    .eq("id", assetId);

  if (error) {
    throw new Error(error.message);
  }
}

function toRecord(input: AssetMutationInput) {
  return {
    product_id: input.productId,
    asset_role: input.assetRole,
    asset_view: input.assetView,
    lens_hood_state: input.lensHoodState,
    storage_bucket: input.storageBucket,
    storage_path: input.storagePath,
    source_name: input.sourceName,
    source_url: input.sourceUrl,
    license_notes: input.licenseNotes,
    approval_status: input.approvalStatus,
    reviewed_at: input.approvalStatus === "approved" ? new Date().toISOString() : null,
    background_removed: input.backgroundRemoved,
    calibrated: input.calibrated,
    pixels_per_mm: input.pixelsPerMm,
  };
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

function parseEnum(value: unknown, allowedValues: Set<string>, message: string) {
  if (typeof value !== "string" || !allowedValues.has(value)) {
    throw new Error(message);
  }

  return value;
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
