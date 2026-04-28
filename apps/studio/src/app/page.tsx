import { StudioDashboard } from "@/components/studio-dashboard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { StudioDashboardData } from "@/lib/studio-data";
import { loadStudioDashboardData } from "@/lib/studio-data";

export default async function Home() {
  const state = await loadHomeState();
  const content = renderContent(state);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 md:px-10 md:py-10">
        <section className="panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="eyebrow">Better Camera Size</p>
              <h1 className="font-display text-5xl leading-none tracking-[-0.03em] text-ink md:text-6xl">
                Studio
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                Local-first catalog and comparison shell for validating bodies,
                lenses, generic mount conversions, and default adapter products
                before we build hosted workflows.
              </p>
            </div>

            <div className="rounded-full border border-border bg-panel px-4 py-2 text-sm text-muted">
              Local target: <span className="font-medium text-ink">http://localhost:3400</span>
            </div>
          </div>
        </section>

        {content}
      </main>
    </div>
  );
}

async function loadHomeState(): Promise<
  | { status: "missing-env" }
  | { status: "query-failure"; message: string }
  | { status: "ready"; data: StudioDashboardData }
> {
  const client = getSupabaseAdminClient();

  if (!client) {
    return { status: "missing-env" };
  }

  try {
    const data = await loadStudioDashboardData(client);

    return { status: "ready", data };
  } catch (error) {
    return {
      status: "query-failure",
      message:
        error instanceof Error ? error.message : "Unknown local query failure",
    };
  }
}

function renderContent(
  state:
    | { status: "missing-env" }
    | { status: "query-failure"; message: string }
    | { status: "ready"; data: StudioDashboardData },
) {
  if (state.status === "missing-env") {
    return <MissingEnvironmentState />;
  }

  if (state.status === "query-failure") {
    return <QueryFailureState message={state.message} />;
  }

  return <StudioDashboard data={state.data} />;
}

function MissingEnvironmentState() {
  return (
    <section className="panel space-y-4">
      <p className="eyebrow">Local Environment</p>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">
        Local Supabase keys are not configured yet
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-muted">
        Start the local Supabase stack, run <code>pnpm db:env</code>, and copy the
        local values into <code>apps/studio/.env.local</code> using{" "}
        <code>apps/studio/.env.example</code> as the template.
      </p>
    </section>
  );
}

function QueryFailureState({ message }: { message: string }) {
  return (
    <section className="panel space-y-4">
      <p className="eyebrow">Local Query Failure</p>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">
        The studio app reached the local stack, but the catalog query failed
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-muted">{message}</p>
      <p className="max-w-3xl text-sm leading-6 text-muted">
        The usual local path is: <code>pnpm db:start</code>, then{" "}
        <code>pnpm db:reset</code>, then <code>pnpm studio:dev</code>.
      </p>
    </section>
  );
}
