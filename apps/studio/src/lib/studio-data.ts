import type { SupabaseClient } from "@supabase/supabase-js";

export type StudioProduct = {
  id: string;
  displayName: string;
  slug: string;
  name: string;
  status: string;
  brandId: string | null;
  systemId: string | null;
};

export type StudioMount = {
  id: string;
  name: string;
  shortName: string | null;
};

export type StudioBrand = {
  id: string;
  name: string;
};

export type StudioSystem = {
  id: string;
  name: string;
};

export type StudioSensorFormat = {
  id: string;
  name: string;
};

export type StudioMountLink = {
  productId: string;
  mountId: string;
};

export type StudioBodySpec = {
  productId: string;
  bodyStyle: string;
  sensorFormatId: string | null;
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
  weightG: number | null;
};

export type StudioLensSpec = {
  productId: string;
  lensKind: string;
  imageCircleFormatId: string | null;
  focalLengthMinMm: number | null;
  focalLengthMaxMm: number | null;
  maxApertureWide: number | null;
  maxApertureTele: number | null;
  diameterMm: number | null;
  lengthMm: number | null;
  weightG: number | null;
  filterThreadMm: number | null;
};

export type StudioAdapterSpec = {
  productId: string;
  adapterType: string;
  addsLengthMm: number | null;
  addsWeightG: number | null;
};

export type StudioProductAsset = {
  id: string;
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

export type StudioAdapterMountEdge = {
  adapterProductId: string;
  mountConversionId: string;
};

export type StudioDashboardData = {
  bodies: StudioProduct[];
  lenses: StudioProduct[];
  adapters: StudioProduct[];
  brands: StudioBrand[];
  systems: StudioSystem[];
  sensorFormats: StudioSensorFormat[];
  mounts: StudioMount[];
  bodyMounts: StudioMountLink[];
  lensMounts: StudioMountLink[];
  bodySpecs: StudioBodySpec[];
  lensSpecs: StudioLensSpec[];
  adapterSpecs: StudioAdapterSpec[];
  productAssets: StudioProductAsset[];
  mountConversions: StudioMountConversion[];
  mountConversionDefaults: StudioMountConversionDefault[];
  adapterMountEdges: StudioAdapterMountEdge[];
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
    brandsResult,
    systemsResult,
    sensorFormatsResult,
    mountsResult,
    bodyMountsResult,
    lensMountsResult,
    bodySpecsResult,
    lensSpecsResult,
    adapterSpecsResult,
    productAssetsResult,
    mountConversionsResult,
    mountConversionDefaultsResult,
    adapterMountEdgesResult,
  ] = await Promise.all([
    client
      .schema("catalog")
      .from("products")
      .select("id, slug, name, display_name, status, brand_id, system_id")
      .eq("product_type", "camera_body")
      .order("display_name"),
    client
      .schema("catalog")
      .from("products")
      .select("id, slug, name, display_name, status, brand_id, system_id")
      .eq("product_type", "lens")
      .order("display_name"),
    client
      .schema("catalog")
      .from("products")
      .select("id, slug, name, display_name, status, brand_id, system_id")
      .eq("product_type", "adapter")
      .order("display_name"),
    client.schema("catalog").from("brands").select("id, name").order("name"),
    client.schema("catalog").from("systems").select("id, name").order("name"),
    client
      .schema("catalog")
      .from("sensor_formats")
      .select("id, name")
      .order("name"),
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
      .from("camera_bodies")
      .select(
        "product_id, body_style, sensor_format_id, width_mm, height_mm, depth_mm, weight_g",
      ),
    client
      .schema("catalog")
      .from("lenses")
      .select(
        "product_id, lens_kind, image_circle_format_id, focal_length_min_mm, focal_length_max_mm, max_aperture_wide, max_aperture_tele, diameter_mm, length_mm, weight_g, filter_thread_mm",
      ),
    client
      .schema("catalog")
      .from("adapter_specs")
      .select("product_id, adapter_type, adds_length_mm, adds_weight_g"),
    client
      .schema("catalog")
      .from("product_assets")
      .select(
        "id, product_id, asset_role, asset_view, lens_hood_state, storage_bucket, storage_path, source_name, source_url, license_notes, approval_status, background_removed, calibrated, pixels_per_mm",
      )
      .order("created_at", { ascending: false }),
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
    client
      .schema("catalog")
      .from("adapter_mount_edges")
      .select("adapter_product_id, mount_conversion_id"),
  ]);

  const bodies = requireData(bodiesResult.data, bodiesResult.error, "bodies").map(
    (product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      displayName: product.display_name,
      status: product.status,
      brandId: product.brand_id,
      systemId: product.system_id,
    }),
  );

  const lenses = requireData(lensesResult.data, lensesResult.error, "lenses").map(
    (product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      displayName: product.display_name,
      status: product.status,
      brandId: product.brand_id,
      systemId: product.system_id,
    }),
  );

  const adapters = requireData(
    adaptersResult.data,
    adaptersResult.error,
    "adapters",
  ).map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    displayName: product.display_name,
    status: product.status,
    brandId: product.brand_id,
    systemId: product.system_id,
  }));

  const brands = requireData(brandsResult.data, brandsResult.error, "brands").map(
    (brand) => ({
      id: brand.id,
      name: brand.name,
    }),
  );

  const systems = requireData(systemsResult.data, systemsResult.error, "systems").map(
    (system) => ({
      id: system.id,
      name: system.name,
    }),
  );

  const sensorFormats = requireData(
    sensorFormatsResult.data,
    sensorFormatsResult.error,
    "sensor formats",
  ).map((sensorFormat) => ({
    id: sensorFormat.id,
    name: sensorFormat.name,
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

  const bodySpecs = requireData(
    bodySpecsResult.data,
    bodySpecsResult.error,
    "body specs",
  ).map((record) => ({
    productId: record.product_id,
    bodyStyle: record.body_style,
    sensorFormatId: record.sensor_format_id,
    widthMm: record.width_mm,
    heightMm: record.height_mm,
    depthMm: record.depth_mm,
    weightG: record.weight_g,
  }));

  const lensSpecs = requireData(
    lensSpecsResult.data,
    lensSpecsResult.error,
    "lens specs",
  ).map((record) => ({
    productId: record.product_id,
    lensKind: record.lens_kind,
    imageCircleFormatId: record.image_circle_format_id,
    focalLengthMinMm: record.focal_length_min_mm,
    focalLengthMaxMm: record.focal_length_max_mm,
    maxApertureWide: record.max_aperture_wide,
    maxApertureTele: record.max_aperture_tele,
    diameterMm: record.diameter_mm,
    lengthMm: record.length_mm,
    weightG: record.weight_g,
    filterThreadMm: record.filter_thread_mm,
  }));

  const adapterSpecs = requireData(
    adapterSpecsResult.data,
    adapterSpecsResult.error,
    "adapter specs",
  ).map((record) => ({
    productId: record.product_id,
    adapterType: record.adapter_type,
    addsLengthMm: record.adds_length_mm,
    addsWeightG: record.adds_weight_g,
  }));

  const productAssets = requireData(
    productAssetsResult.data,
    productAssetsResult.error,
    "product assets",
  ).map((record) => ({
    id: record.id,
    productId: record.product_id,
    assetRole: record.asset_role,
    assetView: record.asset_view,
    lensHoodState: record.lens_hood_state,
    storageBucket: record.storage_bucket,
    storagePath: record.storage_path,
    sourceName: record.source_name,
    sourceUrl: record.source_url,
    licenseNotes: record.license_notes,
    approvalStatus: record.approval_status,
    backgroundRemoved: record.background_removed,
    calibrated: record.calibrated,
    pixelsPerMm: record.pixels_per_mm,
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

  const adapterMountEdges = requireData(
    adapterMountEdgesResult.data,
    adapterMountEdgesResult.error,
    "adapter mount edges",
  ).map((record) => ({
    adapterProductId: record.adapter_product_id,
    mountConversionId: record.mount_conversion_id,
  }));

  return {
    bodies,
    lenses,
    adapters,
    brands,
    systems,
    sensorFormats,
    mounts,
    bodyMounts,
    lensMounts,
    bodySpecs,
    lensSpecs,
    adapterSpecs,
    productAssets,
    mountConversions,
    mountConversionDefaults,
    adapterMountEdges,
  } satisfies StudioDashboardData;
}
