import { StudioDashboard, type StudioDashboardView } from "@/components/studio-dashboard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { StudioDashboardData } from "@/lib/studio-data";
import { loadStudioDashboardData } from "@/lib/studio-data";

type StudioResourcePageProps = {
  title: string;
  eyebrow: string;
  description: string;
  view: StudioDashboardView;
};

export async function StudioResourcePage({
  title,
  eyebrow,
  description,
  view,
}: StudioResourcePageProps) {
  const state = await loadStudioState();

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background">
      <section className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-5">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="truncate text-xl font-semibold text-ink">
            {title}
          </h1>
        </div>
        <p className="hidden max-w-2xl truncate text-sm text-muted xl:block">
          {description}
        </p>
      </section>

      <div className="min-h-0 flex-1 overflow-hidden">{renderState(state, view)}</div>
    </div>
  );
}

async function loadStudioState(): Promise<
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

function renderState(
  state:
    | { status: "missing-env" }
    | { status: "query-failure"; message: string }
    | { status: "ready"; data: StudioDashboardData },
  view: StudioDashboardView,
) {
  if (state.status === "missing-env") {
    return <MissingEnvironmentState />;
  }

  if (state.status === "query-failure") {
    return <QueryFailureState message={state.message} />;
  }

  return <StudioDashboard data={state.data} view={view} />;
}

function MissingEnvironmentState() {
  return (
    <section className="panel space-y-4">
      <p className="eyebrow">Local Environment</p>
      <h2 className="text-2xl font-semibold text-ink">
        Local Supabase keys are not configured yet
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-muted">
        Start the local Supabase stack and run <code>pnpm studio:env:local</code>.
      </p>
    </section>
  );
}

function QueryFailureState({ message }: { message: string }) {
  return (
    <section className="panel space-y-4">
      <p className="eyebrow">Local Query Failure</p>
      <h2 className="text-2xl font-semibold text-ink">
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
