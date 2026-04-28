# Local Development

## Non-Negotiable Rule

The full product loop must be testable locally before we optimize for deployment.

That means we should be able to run, validate, and debug locally:

- the database schema
- the studio app
- the internal comparison preview
- the ingest pipeline
- the asset-processing pipeline

Remote hosting is a later concern. Local repeatability is the first requirement.

## Local-First Architecture

The project should work in this order:

1. local database and storage
2. local studio app
3. local workers
4. local preview and end-to-end tests
5. only then hosted environments

This follows Supabase's own local-development guidance, which recommends developing locally with the CLI and Docker-compatible runtime before linking to hosted projects. [Supabase local development](https://supabase.com/docs/guides/local-development) [Schema migrations overview](https://supabase.com/docs/guides/local-development/overview)

## Canonical Local Ports

Reserve these ports from the start:

- `3400`: `apps/studio`
- `3401`: `apps/web` when we begin public-app work
- `3423`: local Supabase Studio
- `3422`: local Supabase Postgres
- `3421`: local Supabase API and Edge Functions base URL
- `3424`: local Supabase Inbucket

These intentionally avoid Supabase's default local port block so this repository can run alongside other local Supabase projects on the same machine.

For database connection details and local keys, do not hardcode values in product code. Use:

```bash
pnpm db:env
```

Supabase documents `supabase status -o env` as the way to export local connection parameters and keys. [Supabase CLI reference](https://supabase.com/docs/reference/cli/supabase-orgs-list)

## Local Stack Requirements

To run the local backend stack, the machine needs:

- Node.js
- `pnpm`
- a Docker-compatible container runtime

Supabase's current docs list Docker Desktop, Rancher Desktop, Podman, and OrbStack as supported container runtimes for local development. [Supabase local development](https://supabase.com/docs/guides/local-development)

## Root Commands

Use these root commands as the standard local path:

```bash
pnpm db:start
pnpm db:status
pnpm db:env
pnpm db:reset
pnpm db:stop
pnpm studio:env:local
pnpm studio:local:prepare
```

These commands wrap the Supabase CLI through `npx`, so the workflow does not depend on a separate global installation path.

## Local Verification Ladder

Every feature should be proven locally at the narrowest realistic layer first.

### Database

Verify locally:

- migrations apply cleanly
- seed data loads
- compatibility queries return expected results

### Studio

Verify locally:

- CRUD flows work against the local Supabase stack
- review state changes persist correctly
- generic mount-conversion selection resolves to the default real adapter

Recommended first-run path:

```bash
pnpm studio:local:prepare
pnpm studio:dev
```

### Renderer / Internal Preview

Verify locally:

- body-only comparisons
- body + adapter + lens comparisons
- front and top views
- metric source measurements render correctly

### Workers

Verify locally:

- crawl jobs write raw source records locally
- extraction jobs create observed facts locally
- asset jobs can read and write local records and files

### End-to-End

Verify locally:

- the studio can create a valid kit
- the preview reflects the expected body, adapter, and lens chain
- no remote dependency is required for the core workflow

Playwright is the intended end-to-end test layer once the apps exist. [Playwright docs](https://playwright.dev/)

## Deployment Gate

Do not deploy a feature just because it works in a hosted environment preview.

A change is only ready to leave local development when:

- the relevant local commands run cleanly
- the changed flow works against the local stack
- the data and render output are verified locally

## Next Implementation Step

When we scaffold `apps/studio`, we should also add:

- committed Supabase local config
- local environment example files
- local seed command
- local worker entrypoints
- a single documented command path for bringing the whole stack up
