create type catalog.asset_approval_status as enum (
  'draft',
  'needs_review',
  'approved',
  'rejected'
);

alter table catalog.product_assets
add column source_name text,
add column source_url text,
add column license_notes text,
add column approval_status catalog.asset_approval_status not null default 'draft',
add column reviewed_at timestamptz;

create index product_assets_product_idx
  on catalog.product_assets (product_id);

create index product_assets_approval_status_idx
  on catalog.product_assets (approval_status);
