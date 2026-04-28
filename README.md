# Better Camera Size

A modern replacement for Camera Size: visual camera, lens, and adapter comparison with a mobile-first UI and a catalog that can stay current.

## Monorepo Layout

- `apps/web`: future web application
- `apps/studio`: internal operations app for catalog editing, review, and pipeline control
- `packages/catalog-schema`: shared TypeScript types and validation for catalog records
- `packages/catalog`: higher-level catalog access and query logic
- `packages/ingest`: importers, scrapers, and reconciliation jobs
- `packages/asset-pipeline`: background removal, calibration, and image QA
- `docs`: architecture, product, and data design
- `supabase`: SQL migrations and local database setup

## Current Focus

The first pass in this repository establishes:

- the monorepo shape
- the product and system architecture
- an initial Supabase/Postgres schema
- the separation between source ingestion, reviewed catalog data, and calibrated render assets

## Docs

- [Architecture](./docs/architecture.md)
- [Database Schema](./docs/database-schema.md)
- [Delivery Roadmap](./docs/delivery-roadmap.md)
- [Engineering Guardrails](./docs/conventions/ENGINEERING_GUARDRAILS.md)
- [Design System Notes](./docs/design-system.md)
- [Shared DESIGN.md](./DESIGN.md)
