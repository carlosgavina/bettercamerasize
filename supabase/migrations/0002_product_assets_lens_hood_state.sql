create type catalog.lens_hood_state as enum (
  'not_applicable',
  'unknown',
  'without_hood',
  'with_hood'
);

alter table catalog.product_assets
add column lens_hood_state catalog.lens_hood_state not null default 'not_applicable';

alter table catalog.product_assets
drop constraint if exists product_assets_product_id_asset_role_asset_view_key;

alter table catalog.product_assets
add constraint product_assets_variant_key
unique (product_id, asset_role, asset_view, lens_hood_state);
