"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/cameras", label: "Cameras" },
  { href: "/lenses", label: "Lenses" },
  { href: "/adapters", label: "Adapters" },
  { href: "/mounts", label: "Mounts" },
  { href: "/conversions", label: "Conversions" },
  { href: "/assets", label: "Assets" },
  { href: "/preview", label: "Preview" },
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-surface px-4 py-4 lg:h-screen lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Link href="/cameras" className="block">
            <p className="eyebrow">Better Camera Size</p>
            <h1 className="mt-2 text-xl font-semibold text-ink">
              Studio
            </h1>
          </Link>
          <div className="hidden rounded-md border border-border px-3 py-1 text-xs font-medium text-muted lg:inline-flex">
            Local
          </div>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto lg:mt-8 lg:flex-col lg:overflow-visible">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "rounded-md border border-border bg-panel-strong px-3 py-2 text-sm font-semibold text-ink"
                    : "rounded-md border border-transparent px-3 py-2 text-sm font-medium text-muted hover:border-border hover:bg-panel"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-h-0 min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
