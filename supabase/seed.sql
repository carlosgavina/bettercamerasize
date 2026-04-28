insert into catalog.brands (slug, name)
values
  ('leica', 'Leica'),
  ('panasonic', 'Panasonic'),
  ('nikon', 'Nikon'),
  ('sigma', 'Sigma'),
  ('voigtlander', 'Voigtlander'),
  ('urth', 'Urth')
on conflict (slug) do nothing;

insert into catalog.systems (slug, name, brand_id)
values
  ('leica-m-system', 'Leica M System', (select id from catalog.brands where slug = 'leica')),
  ('l-mount-system', 'L-Mount System', null),
  ('nikon-z-system', 'Nikon Z System', (select id from catalog.brands where slug = 'nikon'))
on conflict (slug) do nothing;

insert into catalog.sensor_formats (slug, name, width_mm, height_mm, crop_factor)
values
  ('full-frame-35mm', 'Full Frame 35mm', 36.00, 24.00, 1.0000)
on conflict (slug) do nothing;

insert into catalog.mounts (slug, name, short_name, flange_distance_mm)
values
  ('leica-m', 'Leica M mount', 'M', 27.80),
  ('l-mount', 'L mount', 'L', 20.00),
  ('nikon-z', 'Nikon Z mount', 'Z', 16.00)
on conflict (slug) do nothing;

insert into catalog.products (product_type, brand_id, system_id, slug, name, display_name, status)
values
  ('camera_body', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'leica-m-system'), 'leica-m11-p', 'Leica M11-P', 'Leica M11-P', 'active'),
  ('camera_body', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'leica-m-system'), 'leica-m10', 'Leica M10', 'Leica M10', 'active'),
  ('camera_body', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'leica-m-system'), 'leica-m-ev1', 'Leica M EV1', 'Leica M EV1', 'active'),
  ('camera_body', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'l-mount-system'), 'leica-sl3-s', 'Leica SL3-S', 'Leica SL3-S', 'active'),
  ('camera_body', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'l-mount-system'), 'leica-sl3', 'Leica SL3', 'Leica SL3', 'active'),
  ('camera_body', (select id from catalog.brands where slug = 'panasonic'), (select id from catalog.systems where slug = 'l-mount-system'), 'panasonic-lumix-s1ii', 'Panasonic Lumix S1 II', 'Panasonic Lumix S1 II', 'active'),
  ('camera_body', (select id from catalog.brands where slug = 'nikon'), (select id from catalog.systems where slug = 'nikon-z-system'), 'nikon-z8', 'Nikon Z8', 'Nikon Z8', 'active'),
  ('camera_body', (select id from catalog.brands where slug = 'nikon'), (select id from catalog.systems where slug = 'nikon-z-system'), 'nikon-z6ii', 'Nikon Z6 II', 'Nikon Z6 II', 'active'),
  ('lens', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'leica-m-system'), 'leica-noctilux-m-35-f1-2-asph', 'Leica Noctilux-M 35 f/1.2 ASPH.', 'Leica Noctilux-M 35mm f/1.2 ASPH.', 'active'),
  ('lens', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'leica-m-system'), 'leica-summilux-m-28-f1-4-asph', 'Leica Summilux-M 28 f/1.4 ASPH.', 'Leica Summilux-M 28mm f/1.4 ASPH.', 'active'),
  ('lens', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'leica-m-system'), 'leica-apo-summicron-m-35-f2-asph', 'Leica APO-Summicron-M 35 f/2 ASPH.', 'Leica APO-Summicron-M 35mm f/2 ASPH.', 'active'),
  ('lens', (select id from catalog.brands where slug = 'voigtlander'), (select id from catalog.systems where slug = 'leica-m-system'), 'voigtlander-ultron-28-ii', 'Voigtlander Ultron 28mm II', 'Voigtlander Ultron 28mm II', 'active'),
  ('lens', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'l-mount-system'), 'leica-apo-summicron-sl-50-f2-asph', 'Leica APO-Summicron-SL 50 f/2 ASPH.', 'Leica APO-Summicron-SL 50mm f/2 ASPH.', 'active'),
  ('lens', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'l-mount-system'), 'leica-vario-elmarit-sl-90-280-f2-8-4', 'Leica Vario-Elmarit-SL 90-280 f/2.8-4', 'Leica 90-280mm', 'active'),
  ('lens', (select id from catalog.brands where slug = 'sigma'), (select id from catalog.systems where slug = 'l-mount-system'), 'sigma-24-f1-4-dg-art', 'Sigma 24mm F1.4 DG Art', 'Sigma 24mm DG Art f/1.4', 'active'),
  ('lens', (select id from catalog.brands where slug = 'panasonic'), (select id from catalog.systems where slug = 'l-mount-system'), 'lumix-s-18-f1-8', 'Lumix S 18mm F1.8', 'Lumix 18mm f/1.8', 'active'),
  ('lens', (select id from catalog.brands where slug = 'nikon'), (select id from catalog.systems where slug = 'nikon-z-system'), 'nikkor-z-180-600-f5-6-6-3-vr', 'Nikkor Z 180-600mm f/5.6-6.3 VR', 'Nikkor Z 180-600mm', 'active'),
  ('lens', (select id from catalog.brands where slug = 'nikon'), (select id from catalog.systems where slug = 'nikon-z-system'), 'nikkor-z-50-f1-8-s', 'Nikkor Z 50mm f/1.8 S', 'Nikkor Z 50mm f/1.8', 'active'),
  ('lens', (select id from catalog.brands where slug = 'nikon'), (select id from catalog.systems where slug = 'nikon-z-system'), 'nikkor-z-85-f1-2-s', 'Nikkor Z 85mm f/1.2 S', 'Nikkor Z 85mm f/1.2', 'active'),
  ('adapter', (select id from catalog.brands where slug = 'leica'), (select id from catalog.systems where slug = 'l-mount-system'), 'leica-m-adapter-l', 'Leica M-Adapter L', 'Leica M-Adapter L', 'active'),
  ('adapter', (select id from catalog.brands where slug = 'urth'), (select id from catalog.systems where slug = 'nikon-z-system'), 'urth-leica-m-to-nikon-z-adapter', 'Urth Leica M Lens Mount to Nikon Z Camera Mount', 'Urth Leica M to Nikon Z Adapter', 'active')
on conflict (slug) do nothing;

insert into catalog.camera_bodies (product_id, body_style, sensor_format_id, interchangeable_lens)
select p.id, 'rangefinder', sf.id, true
from catalog.products p
cross join catalog.sensor_formats sf
where p.slug in ('leica-m11-p', 'leica-m10', 'leica-m-ev1')
  and sf.slug = 'full-frame-35mm'
on conflict (product_id) do nothing;

insert into catalog.camera_bodies (product_id, body_style, sensor_format_id, interchangeable_lens)
select p.id, 'mirrorless', sf.id, true
from catalog.products p
cross join catalog.sensor_formats sf
where p.slug in ('leica-sl3-s', 'leica-sl3', 'panasonic-lumix-s1ii', 'nikon-z8', 'nikon-z6ii')
  and sf.slug = 'full-frame-35mm'
on conflict (product_id) do nothing;

insert into catalog.body_mounts (body_product_id, mount_id, is_native)
select p.id, m.id, true
from catalog.products p
join catalog.mounts m on m.slug = 'leica-m'
where p.slug in ('leica-m11-p', 'leica-m10', 'leica-m-ev1')
on conflict (body_product_id, mount_id) do nothing;

insert into catalog.body_mounts (body_product_id, mount_id, is_native)
select p.id, m.id, true
from catalog.products p
join catalog.mounts m on m.slug = 'l-mount'
where p.slug in ('leica-sl3-s', 'leica-sl3', 'panasonic-lumix-s1ii')
on conflict (body_product_id, mount_id) do nothing;

insert into catalog.body_mounts (body_product_id, mount_id, is_native)
select p.id, m.id, true
from catalog.products p
join catalog.mounts m on m.slug = 'nikon-z'
where p.slug in ('nikon-z8', 'nikon-z6ii')
on conflict (body_product_id, mount_id) do nothing;

insert into catalog.lenses (product_id, lens_kind, image_circle_format_id)
select p.id, 'prime', sf.id
from catalog.products p
cross join catalog.sensor_formats sf
where p.slug in (
  'leica-noctilux-m-35-f1-2-asph',
  'leica-summilux-m-28-f1-4-asph',
  'leica-apo-summicron-m-35-f2-asph',
  'voigtlander-ultron-28-ii',
  'leica-apo-summicron-sl-50-f2-asph',
  'sigma-24-f1-4-dg-art',
  'lumix-s-18-f1-8',
  'nikkor-z-50-f1-8-s',
  'nikkor-z-85-f1-2-s'
)
  and sf.slug = 'full-frame-35mm'
on conflict (product_id) do nothing;

insert into catalog.lenses (product_id, lens_kind, image_circle_format_id)
select p.id, 'zoom', sf.id
from catalog.products p
cross join catalog.sensor_formats sf
where p.slug in (
  'leica-vario-elmarit-sl-90-280-f2-8-4',
  'nikkor-z-180-600-f5-6-6-3-vr'
)
  and sf.slug = 'full-frame-35mm'
on conflict (product_id) do nothing;

insert into catalog.lens_mounts (lens_product_id, mount_id, is_native)
select p.id, m.id, true
from catalog.products p
join catalog.mounts m on m.slug = 'leica-m'
where p.slug in (
  'leica-noctilux-m-35-f1-2-asph',
  'leica-summilux-m-28-f1-4-asph',
  'leica-apo-summicron-m-35-f2-asph',
  'voigtlander-ultron-28-ii'
)
on conflict (lens_product_id, mount_id) do nothing;

insert into catalog.lens_mounts (lens_product_id, mount_id, is_native)
select p.id, m.id, true
from catalog.products p
join catalog.mounts m on m.slug = 'l-mount'
where p.slug in (
  'leica-apo-summicron-sl-50-f2-asph',
  'leica-vario-elmarit-sl-90-280-f2-8-4',
  'sigma-24-f1-4-dg-art',
  'lumix-s-18-f1-8'
)
on conflict (lens_product_id, mount_id) do nothing;

insert into catalog.lens_mounts (lens_product_id, mount_id, is_native)
select p.id, m.id, true
from catalog.products p
join catalog.mounts m on m.slug = 'nikon-z'
where p.slug in (
  'nikkor-z-180-600-f5-6-6-3-vr',
  'nikkor-z-50-f1-8-s',
  'nikkor-z-85-f1-2-s'
)
on conflict (lens_product_id, mount_id) do nothing;

insert into catalog.mount_conversions (
  body_mount_id,
  lens_mount_id,
  theoretical_extension_mm,
  mechanically_possible,
  optics_required,
  preserves_infinity_focus,
  preferred_display_name
)
values
  (
    (select id from catalog.mounts where slug = 'l-mount'),
    (select id from catalog.mounts where slug = 'leica-m'),
    7.80,
    true,
    false,
    true,
    'Leica M -> Leica L adapter'
  ),
  (
    (select id from catalog.mounts where slug = 'nikon-z'),
    (select id from catalog.mounts where slug = 'leica-m'),
    11.80,
    true,
    false,
    true,
    'Leica M -> Nikon Z adapter'
  )
on conflict (body_mount_id, lens_mount_id) do nothing;

insert into catalog.adapter_specs (
  product_id,
  adapter_type,
  adds_length_mm,
  adds_weight_g,
  preserves_infinity_focus,
  passes_electronics,
  autofocus_supported,
  aperture_control_supported
)
values
  (
    (select id from catalog.products where slug = 'leica-m-adapter-l'),
    'mechanical',
    13.30,
    70.00,
    true,
    false,
    false,
    false
  ),
  (
    (select id from catalog.products where slug = 'urth-leica-m-to-nikon-z-adapter'),
    'mechanical',
    null,
    null,
    true,
    false,
    false,
    false
  )
on conflict (product_id) do nothing;

insert into catalog.adapter_mount_edges (adapter_product_id, mount_conversion_id)
values
  (
    (select id from catalog.products where slug = 'leica-m-adapter-l'),
    (select id from catalog.mount_conversions where preferred_display_name = 'Leica M -> Leica L adapter')
  ),
  (
    (select id from catalog.products where slug = 'urth-leica-m-to-nikon-z-adapter'),
    (select id from catalog.mount_conversions where preferred_display_name = 'Leica M -> Nikon Z adapter')
  )
on conflict (adapter_product_id, mount_conversion_id) do nothing;

insert into catalog.mount_conversion_defaults (mount_conversion_id, default_adapter_product_id, notes)
values
  (
    (select id from catalog.mount_conversions where preferred_display_name = 'Leica M -> Leica L adapter'),
    (select id from catalog.products where slug = 'leica-m-adapter-l'),
    'Default official adapter for Leica M lenses on L-mount bodies.'
  ),
  (
    (select id from catalog.mount_conversions where preferred_display_name = 'Leica M -> Nikon Z adapter'),
    (select id from catalog.products where slug = 'urth-leica-m-to-nikon-z-adapter'),
    'Default mechanical adapter for Leica M lenses on Nikon Z bodies in the first seed.'
  )
on conflict (mount_conversion_id) do nothing;
