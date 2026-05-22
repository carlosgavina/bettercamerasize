# Database Schema

## Recommendation

Use a hybrid relational model:

- normalized tables for stable domain entities and constraints
- `jsonb` for source-specific fields and low-confidence long tail data
- explicit provenance tables for automated ingestion

This should stay flexible without becoming shapeless.

## Design Rules

1. Put catalog truth in relational columns when the field is queryable and important.
2. Keep raw source payloads and extraction residue out of the published catalog tables.
3. Model compatibility with directed mount edges.
4. Treat image calibration metadata as first-class schema, not as ad hoc blob fields.
5. Avoid premature user-centric tables until the catalog model is stable.
6. Treat queryable visual variants as first-class asset fields when they affect rendering or filtering.

## Main Schemas

- `catalog`: published product and compatibility data
- `ingest`: source fetches, extracted facts, and reconciliation inputs

## Core Tables

### `catalog.brands`

Manufacturers and related brand metadata.

### `catalog.systems`

Commercial product systems or families.

Examples:

- Leica L-Mount
- Sony Alpha E
- Nikon Z

### `catalog.mounts`

Mount definitions with measurable properties such as flange distance and throat diameter.

### `catalog.products`

Common envelope for every catalog item.

Examples:

- body
- lens
- adapter
- teleconverter

### `catalog.camera_bodies`

Body-only physical properties.

### `catalog.body_mounts`

Mounts that a body exposes.

### `catalog.lenses`

Lens-specific optical and physical properties.

### `catalog.lens_mounts`

Mounts that a lens can attach through natively.

### `catalog.mount_conversions`

Generic mount-pair conversions.

This is the layer that powers simple UX choices like:

- "Leica M to Leica L adapter"
- "Leica M to Nikon Z adapter"

It captures the theoretical or canonical conversion between a body-side mount and a lens-side mount.

### `catalog.mount_conversion_defaults`

Maps a generic mount conversion to the preferred default adapter product.

This lets the UI stay simple while still resolving to a real adapter for:

- dimensions
- weight
- rendering
- source-backed product metadata

### `catalog.adapter_specs`

Adapter-specific physical and functional properties.

### `catalog.adapter_mount_edges`

Links a real adapter product to one or more mount conversions.

This is the key table for resolving questions like:

- "Can this body use this lens?"
- "Which lenses become reachable if I add this adapter?"
- "What is the total added length and weight of the chain?"

### `catalog.product_assets`

Render-ready asset metadata, including calibration fields like `pixels_per_mm`, mount anchors, and lens-specific visual configuration such as hood state.

Important details:

- hood state belongs on the asset, not the lens, because the same lens can have multiple valid render assets for the same view
- `lens_hood_state` should distinguish at least:
  - `with_hood`
  - `without_hood`
  - `unknown` for unreviewed lens assets
  - `not_applicable` for non-lens assets
- uniqueness should include hood state so the catalog can store both hooded and non-hooded variants for the same lens view

## Provenance Tables

### `ingest.data_sources`

Source registry with policy and licensing notes.

### `ingest.source_records`

Fetched pages, documents, or asset lists.

### `ingest.observed_facts`

Field-level extracted values with confidence and normalization output.

This lets us compare multiple sources instead of trusting the first parse.

## What Should Live in `jsonb`

Good candidates:

- vendor-specific feature flags
- raw scraped payload fragments
- asset-processing diagnostics
- uncommon lens/body attributes that are not yet part of product requirements

Bad candidates:

- width, height, depth, weight
- mount identifiers
- focal length
- aperture
- asset calibration anchors
- hooded vs non-hooded render state when it affects which asset should be selected

If a field drives filtering, comparison, compatibility, or layout, it should not be trapped in `jsonb`.

## Search Recommendation

Start with Postgres text and trigram search on:

- product name
- display name
- brand
- system
- mount

This is enough for the first product version. External search can wait.

## Query Layer Recommendation

Keep the application close to SQL.

Recommended:

- SQL migrations
- database views for common read models
- SQL functions or RPCs for recursive compatibility resolution
- generated database types in the TypeScript layer

Not recommended for v1:

- hiding the whole catalog behind a generic ORM abstraction

The key domain behavior is relational and graph-shaped. The database should own more of it, not less.

## Migration Strategy

1. Keep catalog migrations explicit and reviewable.
2. Add seed data for a small trusted dataset first.
3. Write database views for common app queries once the core schema settles.
4. Delay aggressive denormalization until real query patterns appear.

## Example Query Shape

To resolve reachable lens mounts for a selected body:

1. read the body's native mounts from `catalog.body_mounts`
2. collect matching generic conversions from `catalog.mount_conversions`
3. optionally resolve a default adapter from `catalog.mount_conversion_defaults`
4. collect reachable lens-side mounts
5. join against `catalog.lens_mounts`
6. apply extra filters for image coverage, autofocus support, or optical behavior

That query pattern is why the mount graph belongs in Postgres.
