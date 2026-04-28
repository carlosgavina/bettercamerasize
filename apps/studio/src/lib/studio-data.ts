import type { SupabaseClient } from "@supabase/supabase-js";

export type StudioProduct = {
  id: string;
  displayName: string;
  slug: string;
};

export type StudioMount = {
  id: string;
  name: string;
  shortName: string | null;
};

export type StudioMountLink = {
  productId: string;
  mountId: string;
};

export type StudioMountConversion = {
  id: string;
  preferredDisplayName: string | null;
  bodyMountId: string;
  lensMountId: string;
  theoreticalExtensionMm: number | null;
};

export type StudioMountConversionDefault = {
  mountConversionId: string;
  defaultAdapterProductId: string;
};

export type StudioDashboardData = {
  bodies: StudioProduct[];
  lenses: StudioProduct[];
  adapters: StudioProduct[];
  mounts: StudioMount[];
  bodyMounts: StudioMountLink[];
  lensMounts: StudioMountLink[];
  mountConversions: StudioMountConversion[];
  mountConversionDefaults: StudioMountConversionDefault[];
};

function requireData<T>(
  value: T | null,
  error: { message?: string } | null,
  label: string,
) {
  if (error) {
    throw new Error(`${label}: ${error.message ?? "unknown error"}`);
  }

  if (!value) {
    throw new Error(`${label}: missing data`);
  }

  return value;
}

export async function loadStudioDashboardData(client: SupabaseClient) {
  const [
    bodiesResult,
    lensesResult,
    adaptersResult,
    mountsResult,
    bodyMountsResult,
    lensMountsResult,
    mountConversionsResult,
    mountConversionDefaultsResult,
  ] = await Promise.all([
    client
      .schema("catalog")
      .from("products")
      .select("id, slug, display_name")
      .eq("product_type", "camera_body")
      .order("display_name"),
    client
      .schema("catalog")
      .from("products")
      .select("id, slug, display_name")
      .eq("product_type", "lens")
      .order("display_name"),
    client
      .schema("catalog")
      .from("products")
      .select("id, slug, display_name")
      .eq("product_type", "adapter")
      .order("display_name"),
    client
      .schema("catalog")
      .from("mounts")
      .select("id, name, short_name")
      .order("name"),
    client
      .schema("catalog")
      .from("body_mounts")
      .select("body_product_id, mount_id"),
    client
      .schema("catalog")
      .from("lens_mounts")
      .select("lens_product_id, mount_id"),
    client
      .schema("catalog")
      .from("mount_conversions")
      .select(
        "id, preferred_display_name, body_mount_id, lens_mount_id, theoretical_extension_mm",
      )
      .order("preferred_display_name"),
    client
      .schema("catalog")
      .from("mount_conversion_defaults")
      .select("mount_conversion_id, default_adapter_product_id"),
  ]);

  const bodies = requireData(bodiesResult.data, bodiesResult.error, "bodies").map(
    (product) => ({
      id: product.id,
      slug: product.slug,
      displayName: product.display_name,
    }),
  );

  const lenses = requireData(lensesResult.data, lensesResult.error, "lenses").map(
    (product) => ({
      id: product.id,
      slug: product.slug,
      displayName: product.display_name,
    }),
  );

  const adapters = requireData(
    adaptersResult.data,
    adaptersResult.error,
    "adapters",
  ).map((product) => ({
    id: product.id,
    slug: product.slug,
    displayName: product.display_name,
  }));

  const mounts = requireData(mountsResult.data, mountsResult.error, "mounts").map(
    (mount) => ({
      id: mount.id,
      name: mount.name,
      shortName: mount.short_name,
    }),
  );

  const bodyMounts = requireData(
    bodyMountsResult.data,
    bodyMountsResult.error,
    "body mounts",
  ).map((record) => ({
    productId: record.body_product_id,
    mountId: record.mount_id,
  }));

  const lensMounts = requireData(
    lensMountsResult.data,
    lensMountsResult.error,
    "lens mounts",
  ).map((record) => ({
    productId: record.lens_product_id,
    mountId: record.mount_id,
  }));

  const mountConversions = requireData(
    mountConversionsResult.data,
    mountConversionsResult.error,
    "mount conversions",
  ).map((conversion) => ({
    id: conversion.id,
    preferredDisplayName: conversion.preferred_display_name,
    bodyMountId: conversion.body_mount_id,
    lensMountId: conversion.lens_mount_id,
    theoreticalExtensionMm: conversion.theoretical_extension_mm,
  }));

  const mountConversionDefaults = requireData(
    mountConversionDefaultsResult.data,
    mountConversionDefaultsResult.error,
    "mount conversion defaults",
  ).map((record) => ({
    mountConversionId: record.mount_conversion_id,
    defaultAdapterProductId: record.default_adapter_product_id,
  }));

  return {
    bodies,
    lenses,
    adapters,
    mounts,
    bodyMounts,
    lensMounts,
    mountConversions,
    mountConversionDefaults,
  } satisfies StudioDashboardData;
}
