import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const targetPath = resolve(repoRoot, "apps/studio/.env.local");

const envOutput = execSync("npx supabase@2.95.5 status -o env", {
  cwd: repoRoot,
  encoding: "utf8",
});

const parsed = new Map();

for (const line of envOutput.split("\n")) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("Stopped services:")) {
    continue;
  }

  const match = /^(?:export\s+)?([A-Z0-9_]+)=(.*)$/.exec(trimmed);

  if (!match) {
    continue;
  }

  const [, key, rawValue] = match;
  const value = rawValue.replace(/^"/, "").replace(/"$/, "");
  parsed.set(key, value);
}

const supabaseUrl = parsed.get("API_URL");
const anonKey = parsed.get("ANON_KEY");
const serviceRoleKey = parsed.get("SERVICE_ROLE_KEY");

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error(
    "Local Supabase env output is missing one or more required values (API_URL, ANON_KEY, SERVICE_ROLE_KEY). Start the local stack with `pnpm db:start` and try again.",
  );
}

mkdirSync(dirname(targetPath), { recursive: true });

writeFileSync(
  targetPath,
  [
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`,
    `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`,
    "",
  ].join("\n"),
  "utf8",
);

process.stdout.write(`Wrote ${targetPath}\n`);
