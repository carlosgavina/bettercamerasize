import type { SupabaseClient } from "@supabase/supabase-js";

export type MountConversionMutationInput = {
  bodyMountId: string;
  lensMountId: string;
  preferredDisplayName: null | string;
  theoreticalExtensionMm: null | number;
  linkedAdapterProductIds: string[];
  defaultAdapterProductId: null | string;
};

type MutationPayload = {
  bodyMountId?: unknown;
  lensMountId?: unknown;
  preferredDisplayName?: unknown;
  theoreticalExtensionMm?: unknown;
  linkedAdapterProductIds?: unknown;
  defaultAdapterProductId?: unknown;
};

export function parseMountConversionPayload(
  payload: MutationPayload,
): MountConversionMutationInput {
  const bodyMountId = parseRequiredString(payload.bodyMountId, "Body mount is required.");
  const lensMountId = parseRequiredString(payload.lensMountId, "Lens mount is required.");

  if (bodyMountId === lensMountId) {
    throw new Error("Body mount and lens mount must be different.");
  }

  const linkedAdapterProductIds = Array.isArray(payload.linkedAdapterProductIds)
    ? Array.from(
        new Set(
          payload.linkedAdapterProductIds
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .filter(Boolean),
        ),
      )
    : [];

  const defaultAdapterProductId = parseNullableString(payload.defaultAdapterProductId);

  if (
    defaultAdapterProductId &&
    !linkedAdapterProductIds.includes(defaultAdapterProductId)
  ) {
    throw new Error("Default adapter must also be linked to the conversion.");
  }

  return {
    bodyMountId,
    lensMountId,
    preferredDisplayName: parseNullableString(payload.preferredDisplayName),
    theoreticalExtensionMm: parseNullableNumber(payload.theoreticalExtensionMm),
    linkedAdapterProductIds,
    defaultAdapterProductId,
  };
}

export async function createMountConversionBundle(
  client: SupabaseClient,
  input: MountConversionMutationInput,
) {
  const { data: conversion, error: insertError } = await client
    .schema("catalog")
    .from("mount_conversions")
    .insert({
      body_mount_id: input.bodyMountId,
      lens_mount_id: input.lensMountId,
      preferred_display_name: input.preferredDisplayName,
      theoretical_extension_mm: input.theoreticalExtensionMm,
    })
    .select("id")
    .single();

  if (insertError || !conversion) {
    throw new Error(insertError?.message ?? "Failed to create mount conversion.");
  }

  await syncAdapterLinks(client, conversion.id, input.linkedAdapterProductIds);
  await syncDefaultAdapter(client, conversion.id, input.defaultAdapterProductId);

  return conversion.id;
}

export async function updateMountConversionBundle(
  client: SupabaseClient,
  conversionId: string,
  input: MountConversionMutationInput,
) {
  const { error: updateError } = await client
    .schema("catalog")
    .from("mount_conversions")
    .update({
      body_mount_id: input.bodyMountId,
      lens_mount_id: input.lensMountId,
      preferred_display_name: input.preferredDisplayName,
      theoretical_extension_mm: input.theoreticalExtensionMm,
    })
    .eq("id", conversionId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await syncAdapterLinks(client, conversionId, input.linkedAdapterProductIds);
  await syncDefaultAdapter(client, conversionId, input.defaultAdapterProductId);
}

export async function deleteMountConversionBundle(
  client: SupabaseClient,
  conversionId: string,
) {
  const { error } = await client
    .schema("catalog")
    .from("mount_conversions")
    .delete()
    .eq("id", conversionId);

  if (error) {
    throw new Error(error.message);
  }
}

async function syncAdapterLinks(
  client: SupabaseClient,
  conversionId: string,
  linkedAdapterProductIds: string[],
) {
  const { data: currentEdges, error: currentEdgesError } = await client
    .schema("catalog")
    .from("adapter_mount_edges")
    .select("adapter_product_id")
    .eq("mount_conversion_id", conversionId);

  if (currentEdgesError) {
    throw new Error(currentEdgesError.message);
  }

  const currentIds = new Set(
    (currentEdges ?? []).map((edge) => edge.adapter_product_id),
  );
  const nextIds = new Set(linkedAdapterProductIds);

  const idsToDelete = [...currentIds].filter((id) => !nextIds.has(id));
  const idsToInsert = [...nextIds].filter((id) => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await client
      .schema("catalog")
      .from("adapter_mount_edges")
      .delete()
      .eq("mount_conversion_id", conversionId)
      .in("adapter_product_id", idsToDelete);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  if (idsToInsert.length > 0) {
    const { error: insertError } = await client
      .schema("catalog")
      .from("adapter_mount_edges")
      .insert(
        idsToInsert.map((adapterProductId) => ({
          adapter_product_id: adapterProductId,
          mount_conversion_id: conversionId,
        })),
      );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

async function syncDefaultAdapter(
  client: SupabaseClient,
  conversionId: string,
  defaultAdapterProductId: null | string,
) {
  if (!defaultAdapterProductId) {
    const { error: deleteError } = await client
      .schema("catalog")
      .from("mount_conversion_defaults")
      .delete()
      .eq("mount_conversion_id", conversionId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return;
  }

  const { error: upsertError } = await client
    .schema("catalog")
    .from("mount_conversion_defaults")
    .upsert(
      {
        mount_conversion_id: conversionId,
        default_adapter_product_id: defaultAdapterProductId,
      },
      { onConflict: "mount_conversion_id" },
    );

  if (upsertError) {
    throw new Error(upsertError.message);
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

function parseNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Theoretical extension must be a positive number or blank.");
  }

  return parsed;
}
