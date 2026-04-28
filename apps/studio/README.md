# Studio App

Internal operations surface for:

- catalog management
- generic mount-conversion defaults
- adapter-chain review
- future ingest and asset-review workflows

## Local Run Path

1. Start and reset the local Supabase stack from the repo root.
2. Generate `.env.local` from the local Supabase keys.
3. Run the studio app on port `3400`.

### Commands

From the repo root:

```bash
pnpm studio:local:prepare
pnpm studio:dev
```

If you want the steps split out instead of using the combined command:

```bash
pnpm db:start
pnpm db:reset
pnpm studio:env:local
pnpm studio:dev
```

The initial studio shell expects:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Use [`.env.example`](./.env.example) as the starting template if you need to inspect the expected shape manually. The recommended path is to generate `.env.local` automatically from the running local Supabase stack.
