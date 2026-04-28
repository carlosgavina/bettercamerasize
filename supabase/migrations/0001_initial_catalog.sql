create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

create schema if not exists catalog;
create schema if not exists ingest;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type catalog.product_type as enum (
  'camera_body',
  'lens',
  'adapter',
  'teleconverter',
  'speed_booster',
  'accessory'
);

create type catalog.body_style as enum (
  'mirrorless',
  'dslr',
  'rangefinder',
  'compact',
  'medium_format',
  'fixed_lens',
  'cine'
);

create type catalog.lens_kind as enum (
  'prime',
  'zoom',
  'teleconverter',
  'extender'
);

create type catalog.asset_role as enum (
  'reference',
  'calibrated_cutout',
  'thumbnail',
  'overlay'
);

create type catalog.asset_view as enum (
  'front',
  'rear',
  'left',
  'right',
  'top',
  'bottom',
  'mount_front',
  'mount_rear',
  'three_quarter'
);

create type ingest.source_kind as enum (
  'manufacturer',
  'retailer',
  'review',
  'manual',
  'user_submission',
  'internal'
);

create table catalog.brands (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null unique,
  country_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog.systems (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references catalog.brands(id) on delete set null,
  slug citext not null unique,
  name text not null unique,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog.sensor_formats (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null unique,
  width_mm numeric(8,2),
  height_mm numeric(8,2),
  crop_factor numeric(8,4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog.mounts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references catalog.brands(id) on delete set null,
  system_id uuid references catalog.systems(id) on delete set null,
  slug citext not null unique,
  name text not null unique,
  short_name text,
  throat_diameter_mm numeric(8,2),
  flange_distance_mm numeric(8,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ingest.data_sources (
  id uuid primary key default gen_random_uuid(),
  kind ingest.source_kind not null,
  name text not null,
  base_url text,
  terms_url text,
  allowed_automation boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, base_url)
);

create table catalog.products (
  id uuid primary key default gen_random_uuid(),
  product_type catalog.product_type not null,
  brand_id uuid references catalog.brands(id) on delete restrict,
  system_id uuid references catalog.systems(id) on delete set null,
  slug citext not null unique,
  name text not null,
  display_name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'discontinued', 'archived')),
  announced_on date,
  discontinued_on date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog.camera_bodies (
  product_id uuid primary key references catalog.products(id) on delete cascade,
  body_style catalog.body_style not null,
  sensor_format_id uuid references catalog.sensor_formats(id) on delete set null,
  interchangeable_lens boolean not null default true,
  width_mm numeric(8,2),
  height_mm numeric(8,2),
  depth_mm numeric(8,2),
  weight_g numeric(8,2),
  weather_sealed boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog.body_mounts (
  id uuid primary key default gen_random_uuid(),
  body_product_id uuid not null references catalog.products(id) on delete cascade,
  mount_id uuid not null references catalog.mounts(id) on delete restrict,
  is_native boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (body_product_id, mount_id)
);

create table catalog.lenses (
  product_id uuid primary key references catalog.products(id) on delete cascade,
  lens_kind catalog.lens_kind not null,
  image_circle_format_id uuid references catalog.sensor_formats(id) on delete set null,
  focal_length_min_mm numeric(8,2),
  focal_length_max_mm numeric(8,2),
  max_aperture_wide numeric(6,2),
  max_aperture_tele numeric(6,2),
  min_aperture numeric(6,2),
  diameter_mm numeric(8,2),
  length_mm numeric(8,2),
  weight_g numeric(8,2),
  filter_thread_mm numeric(8,2),
  has_optical_stabilization boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog.lens_mounts (
  id uuid primary key default gen_random_uuid(),
  lens_product_id uuid not null references catalog.products(id) on delete cascade,
  mount_id uuid not null references catalog.mounts(id) on delete restrict,
  is_native boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (lens_product_id, mount_id)
);

create table catalog.mount_conversions (
  id uuid primary key default gen_random_uuid(),
  body_mount_id uuid not null references catalog.mounts(id) on delete restrict,
  lens_mount_id uuid not null references catalog.mounts(id) on delete restrict,
  theoretical_extension_mm numeric(8,2),
  mechanically_possible boolean not null default true,
  optics_required boolean not null default false,
  preserves_infinity_focus boolean,
  preferred_display_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (body_mount_id, lens_mount_id)
);

create table catalog.adapter_specs (
  product_id uuid primary key references catalog.products(id) on delete cascade,
  adapter_type text not null check (adapter_type in ('mechanical', 'electronic', 'optical', 'teleconverter', 'speed_booster')),
  adds_length_mm numeric(8,2),
  adds_weight_g numeric(8,2),
  focal_length_multiplier numeric(8,4) not null default 1,
  aperture_multiplier numeric(8,4) not null default 1,
  crop_factor numeric(8,4) not null default 1,
  preserves_infinity_focus boolean not null default true,
  passes_electronics boolean not null default false,
  autofocus_supported boolean,
  aperture_control_supported boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog.adapter_mount_edges (
  id uuid primary key default gen_random_uuid(),
  adapter_product_id uuid not null references catalog.products(id) on delete cascade,
  mount_conversion_id uuid not null references catalog.mount_conversions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (adapter_product_id, mount_conversion_id)
);

create table catalog.mount_conversion_defaults (
  mount_conversion_id uuid primary key references catalog.mount_conversions(id) on delete cascade,
  default_adapter_product_id uuid not null references catalog.products(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ingest.source_records (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references ingest.data_sources(id) on delete cascade,
  external_key text,
  source_url text not null,
  fetched_at timestamptz not null default now(),
  checksum text,
  payload jsonb not null default '{}'::jsonb,
  asset_urls text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb
);

create table ingest.observed_facts (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null references ingest.source_records(id) on delete cascade,
  product_id uuid references catalog.products(id) on delete set null,
  field_path text not null,
  raw_value text,
  normalized_value jsonb not null default 'null'::jsonb,
  unit text,
  confidence numeric(4,3) check (confidence >= 0 and confidence <= 1),
  observed_at timestamptz not null default now(),
  is_selected boolean not null default false
);

create table catalog.product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references catalog.products(id) on delete cascade,
  source_record_id uuid references ingest.source_records(id) on delete set null,
  asset_role catalog.asset_role not null,
  asset_view catalog.asset_view not null,
  storage_bucket text not null,
  storage_path text not null unique,
  mime_type text,
  width_px integer,
  height_px integer,
  pixels_per_mm numeric(12,6),
  background_removed boolean not null default false,
  calibrated boolean not null default false,
  baseline_y_px numeric(12,4),
  mount_center_x_px numeric(12,4),
  mount_center_y_px numeric(12,4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, asset_role, asset_view)
);

create index products_display_name_trgm_idx
  on catalog.products
  using gin (display_name gin_trgm_ops);

create index products_name_trgm_idx
  on catalog.products
  using gin (name gin_trgm_ops);

create index body_mounts_mount_idx
  on catalog.body_mounts (mount_id);

create index lens_mounts_mount_idx
  on catalog.lens_mounts (mount_id);

create index mount_conversions_body_mount_idx
  on catalog.mount_conversions (body_mount_id);

create index mount_conversions_lens_mount_idx
  on catalog.mount_conversions (lens_mount_id);

create index adapter_mount_edges_conversion_idx
  on catalog.adapter_mount_edges (mount_conversion_id);

create index observed_facts_product_field_idx
  on ingest.observed_facts (product_id, field_path);

create index source_records_source_url_idx
  on ingest.source_records (source_url);

create trigger brands_set_updated_at
before update on catalog.brands
for each row execute function public.set_updated_at();

create trigger systems_set_updated_at
before update on catalog.systems
for each row execute function public.set_updated_at();

create trigger sensor_formats_set_updated_at
before update on catalog.sensor_formats
for each row execute function public.set_updated_at();

create trigger mounts_set_updated_at
before update on catalog.mounts
for each row execute function public.set_updated_at();

create trigger data_sources_set_updated_at
before update on ingest.data_sources
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on catalog.products
for each row execute function public.set_updated_at();

create trigger camera_bodies_set_updated_at
before update on catalog.camera_bodies
for each row execute function public.set_updated_at();

create trigger lenses_set_updated_at
before update on catalog.lenses
for each row execute function public.set_updated_at();

create trigger mount_conversions_set_updated_at
before update on catalog.mount_conversions
for each row execute function public.set_updated_at();

create trigger adapter_specs_set_updated_at
before update on catalog.adapter_specs
for each row execute function public.set_updated_at();

create trigger mount_conversion_defaults_set_updated_at
before update on catalog.mount_conversion_defaults
for each row execute function public.set_updated_at();

create trigger product_assets_set_updated_at
before update on catalog.product_assets
for each row execute function public.set_updated_at();

grant usage on schema catalog to service_role;
grant usage on schema ingest to service_role;

grant select, insert, update, delete on all tables in schema catalog to service_role;
grant select, insert, update, delete on all tables in schema ingest to service_role;

grant usage, select on all sequences in schema catalog to service_role;
grant usage, select on all sequences in schema ingest to service_role;

alter default privileges in schema catalog
grant select, insert, update, delete on tables to service_role;

alter default privileges in schema ingest
grant select, insert, update, delete on tables to service_role;

alter default privileges in schema catalog
grant usage, select on sequences to service_role;

alter default privileges in schema ingest
grant usage, select on sequences to service_role;
