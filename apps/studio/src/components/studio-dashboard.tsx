"use client";

import { useMemo, useState } from "react";

import type {
  StudioDashboardData,
  StudioMount,
  StudioProduct,
} from "@/lib/studio-data";

type StudioDashboardProps = {
  data: StudioDashboardData;
};

type ResolutionResult = {
  kind: "native" | "adapter";
  label: string;
  adapterName?: string;
  theoreticalExtensionMm?: number | null;
};

type AdapterOption = {
  id: string;
  kind: "native" | "conversion";
  label: string;
  adapterName?: string;
  theoreticalExtensionMm?: number | null;
  lensMountId?: string;
};

const NO_ADAPTER_ID = "__native__";

export function StudioDashboard({ data }: StudioDashboardProps) {
  const mountsById = useMemo(
    () => new Map(data.mounts.map((mount) => [mount.id, mount])),
    [data.mounts],
  );

  const adaptersById = useMemo(
    () => new Map(data.adapters.map((adapter) => [adapter.id, adapter])),
    [data.adapters],
  );

  const mountConversionDefaultsById = useMemo(
    () =>
      new Map(
        data.mountConversionDefaults.map((record) => [
          record.mountConversionId,
          record.defaultAdapterProductId,
        ]),
      ),
    [data.mountConversionDefaults],
  );

  const initialSelection = useMemo(
    () => getInitialSelection(data),
    [data],
  );

  const [selectedBodyId, setSelectedBodyId] = useState<string>(initialSelection.bodyId);
  const [selectedAdapterId, setSelectedAdapterId] = useState<string>(NO_ADAPTER_ID);
  const [selectedLensId, setSelectedLensId] = useState<string>(initialSelection.lensId);

  const selectedBody = data.bodies.find((body) => body.id === selectedBodyId) ?? null;

  const adapterOptions = useMemo(
    () =>
      selectedBody
        ? getAdapterOptions({
            data,
            mountsById,
            adaptersById,
            mountConversionDefaultsById,
            selectedBody,
          })
        : [],
    [adaptersById, data, mountConversionDefaultsById, mountsById, selectedBody],
  );

  const effectiveSelectedAdapterId = adapterOptions.some(
    (option) => option.id === selectedAdapterId,
  )
    ? selectedAdapterId
    : (adapterOptions[0]?.id ?? NO_ADAPTER_ID);

  const selectedAdapterOption =
    adapterOptions.find((option) => option.id === effectiveSelectedAdapterId) ??
    adapterOptions[0] ??
    null;

  const compatibleLenses = useMemo(
    () =>
      selectedBody && selectedAdapterOption
        ? getCompatibleLenses({
            data,
            selectedBody,
            selectedAdapterOption,
          })
        : [],
    [data, selectedAdapterOption, selectedBody],
  );

  const effectiveSelectedLensId = compatibleLenses.some(
    (lens) => lens.id === selectedLensId,
  )
    ? selectedLensId
    : (compatibleLenses[0]?.id ?? "");

  const selectedLens =
    compatibleLenses.find((lens) => lens.id === effectiveSelectedLensId) ??
    compatibleLenses[0] ??
    null;

  function handleBodyChange(nextBodyId: string) {
    setSelectedBodyId(nextBodyId);
    setSelectedAdapterId(NO_ADAPTER_ID);

    const nextBody = data.bodies.find((body) => body.id === nextBodyId);

    if (!nextBody) {
      setSelectedLensId("");
      return;
    }

    const nextNativeLenses = getCompatibleLenses({
      data,
      selectedBody: nextBody,
      selectedAdapterOption: {
        id: NO_ADAPTER_ID,
        kind: "native",
        label: "No adapter",
      },
    });

    setSelectedLensId(nextNativeLenses[0]?.id ?? "");
  }

  function handleAdapterChange(nextAdapterId: string) {
    setSelectedAdapterId(nextAdapterId);

    const nextAdapterOption =
      adapterOptions.find((option) => option.id === nextAdapterId) ?? adapterOptions[0] ?? null;

    if (!selectedBody || !nextAdapterOption) {
      setSelectedLensId("");
      return;
    }

    const nextCompatibleLenses = getCompatibleLenses({
      data,
      selectedBody,
      selectedAdapterOption: nextAdapterOption,
    });

    setSelectedLensId((currentLensId) =>
      nextCompatibleLenses.some((lens) => lens.id === currentLensId)
        ? currentLensId
        : (nextCompatibleLenses[0]?.id ?? ""),
    );
  }

  const resolution = useMemo(() => {
    if (!selectedBody || !selectedLens || !selectedAdapterOption) {
      return null;
    }

    return resolveSelection({
      data,
      mountsById,
      selectedBody,
      selectedLens,
      selectedAdapterOption,
    });
  }, [data, mountsById, selectedAdapterOption, selectedBody, selectedLens]);

  return (
    <div className="space-y-10">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Bodies" value={String(data.bodies.length)} />
        <MetricCard label="Lenses" value={String(data.lenses.length)} />
        <MetricCard label="Adapters" value={String(data.adapters.length)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="panel space-y-6">
          <div className="space-y-2">
            <p className="eyebrow">Local Preview</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              Validate body-first filtering
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Choose a body first. Without an adapter, the lens list stays native
              to that mount. If you pick a generic adapter path, the lens choices
              are filtered to the source mount that adapter exposes.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <SelectionCard
              label="Body"
              value={selectedBodyId}
              onChange={handleBodyChange}
              options={data.bodies}
            />
            <SelectionCard
              label="Adapter"
              value={effectiveSelectedAdapterId}
              onChange={handleAdapterChange}
              options={adapterOptions}
            />
            <SelectionCard
              label="Lens"
              value={effectiveSelectedLensId}
              onChange={setSelectedLensId}
              options={compatibleLenses}
              disabled={compatibleLenses.length === 0}
            />
          </div>

          <div className="rounded-[18px] border border-border bg-panel p-4 text-sm text-muted">
            <p>
              Showing <span className="font-medium text-ink">{compatibleLenses.length}</span>{" "}
              compatible lens{compatibleLenses.length === 1 ? "" : "es"} for this path.
            </p>
            {selectedAdapterOption?.kind === "conversion" ? (
              <p className="mt-2">
                Generic adapter choice:{" "}
                <span className="font-medium text-ink">{selectedAdapterOption.label}</span>
              </p>
            ) : (
              <p className="mt-2">
                Adapter choice: <span className="font-medium text-ink">No adapter</span>
              </p>
            )}
          </div>

          <div className="rounded-[20px] border border-border bg-panel-strong p-5">
            <p className="eyebrow">Resolution</p>
            {selectedBody && selectedLens && resolution ? (
              <div className="mt-3 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {selectedBody.displayName}
                  </h3>
                  <p className="text-sm text-muted">{selectedLens.displayName}</p>
                </div>

                <div className="rounded-2xl border border-border bg-panel p-4">
                  <p className="text-sm font-medium text-ink">{resolution.label}</p>
                  {resolution.adapterName ? (
                    <p className="mt-2 text-sm text-muted">
                      Default adapter product:{" "}
                      <span className="font-medium text-ink">
                        {resolution.adapterName}
                      </span>
                    </p>
                  ) : null}
                  {resolution.theoreticalExtensionMm != null ? (
                    <p className="mt-1 text-sm text-muted">
                      Theoretical extension: {resolution.theoreticalExtensionMm} mm
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Choose a body, optional adapter, and compatible lens to inspect the chain.
              </p>
            )}
          </div>
        </div>

        <div className="panel space-y-5">
          <div className="space-y-2">
            <p className="eyebrow">Default Conversions</p>
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Generic choices backed by real products
            </h2>
          </div>

          <div className="space-y-3">
            {data.mountConversions.map((conversion) => {
              const bodyMount = mountsById.get(conversion.bodyMountId) ?? null;
              const lensMount = mountsById.get(conversion.lensMountId) ?? null;
              const defaultAdapterProductId =
                mountConversionDefaultsById.get(conversion.id) ?? null;
              const defaultAdapter = defaultAdapterProductId
                ? adaptersById.get(defaultAdapterProductId) ?? null
                : null;

              return (
                <div
                  key={conversion.id}
                  className="rounded-[18px] border border-border bg-panel p-4"
                >
                  <p className="text-sm font-medium text-ink">
                    {conversion.preferredDisplayName ??
                      formatGenericConversion(bodyMount, lensMount)}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Default: {defaultAdapter?.displayName ?? "Not assigned yet"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function getInitialSelection(data: StudioDashboardData) {
  return {
    bodyId: data.bodies[0]?.id ?? "",
    lensId: "",
  };
}

function getAdapterOptions({
  data,
  mountsById,
  adaptersById,
  mountConversionDefaultsById,
  selectedBody,
}: {
  data: StudioDashboardData;
  mountsById: Map<string, StudioMount>;
  adaptersById: Map<string, StudioProduct>;
  mountConversionDefaultsById: Map<string, string>;
  selectedBody: StudioProduct;
}) {
  const bodyMountIds = getBodyMountIds(data, selectedBody.id);
  const nativeMountLabels = bodyMountIds
    .map((mountId) => mountsById.get(mountId)?.shortName ?? mountsById.get(mountId)?.name)
    .filter(Boolean)
    .join(", ");

  const nativeOption: AdapterOption = {
    id: NO_ADAPTER_ID,
    kind: "native",
    label: nativeMountLabels
      ? `No adapter (${nativeMountLabels})`
      : "No adapter",
  };

  const conversionOptions = data.mountConversions
    .filter((conversion) => bodyMountIds.includes(conversion.bodyMountId))
    .map((conversion) => {
      const defaultAdapterProductId =
        mountConversionDefaultsById.get(conversion.id) ?? null;
      const defaultAdapter = defaultAdapterProductId
        ? adaptersById.get(defaultAdapterProductId) ?? null
        : null;
      const bodyMount = mountsById.get(conversion.bodyMountId) ?? null;
      const lensMount = mountsById.get(conversion.lensMountId) ?? null;

      return {
        id: conversion.id,
        kind: "conversion",
        label:
          conversion.preferredDisplayName ??
          formatGenericConversion(bodyMount, lensMount),
        adapterName: defaultAdapter?.displayName,
        theoreticalExtensionMm: conversion.theoreticalExtensionMm,
        lensMountId: conversion.lensMountId,
      } satisfies AdapterOption;
    });

  return [nativeOption, ...conversionOptions];
}

function getCompatibleLenses({
  data,
  selectedBody,
  selectedAdapterOption,
}: {
  data: StudioDashboardData;
  selectedBody: StudioProduct;
  selectedAdapterOption: AdapterOption;
}) {
  const bodyMountIds = getBodyMountIds(data, selectedBody.id);
  const allowedLensMountIds =
    selectedAdapterOption.kind === "native"
      ? bodyMountIds
      : selectedAdapterOption.lensMountId
        ? [selectedAdapterOption.lensMountId]
        : [];

  return data.lenses.filter((lens) => {
    const lensMountIds = getLensMountIds(data, lens.id);

    return lensMountIds.some((mountId) => allowedLensMountIds.includes(mountId));
  });
}

function resolveSelection({
  data,
  mountsById,
  selectedBody,
  selectedLens,
  selectedAdapterOption,
}: {
  data: StudioDashboardData;
  mountsById: Map<string, StudioMount>;
  selectedBody: StudioProduct;
  selectedLens: StudioProduct;
  selectedAdapterOption: AdapterOption;
}): ResolutionResult {
  if (selectedAdapterOption.kind === "conversion") {
    return {
      kind: "adapter",
      label: selectedAdapterOption.label,
      adapterName: selectedAdapterOption.adapterName,
      theoreticalExtensionMm: selectedAdapterOption.theoreticalExtensionMm,
    };
  }

  const bodyMountIds = getBodyMountIds(data, selectedBody.id);
  const lensMountIds = getLensMountIds(data, selectedLens.id);
  const nativeMatchId = bodyMountIds.find((mountId) => lensMountIds.includes(mountId));
  const nativeMount = nativeMatchId ? mountsById.get(nativeMatchId) ?? null : null;

  return {
    kind: "native",
    label: `No adapter required${nativeMount ? ` (${nativeMount.shortName ?? nativeMount.name})` : ""}`,
  };
}

function getBodyMountIds(data: StudioDashboardData, bodyId: string) {
  return data.bodyMounts
    .filter((record) => record.productId === bodyId)
    .map((record) => record.mountId);
}

function getLensMountIds(data: StudioDashboardData, lensId: string) {
  return data.lensMounts
    .filter((record) => record.productId === lensId)
    .map((record) => record.mountId);
}

function formatGenericConversion(
  bodyMount: StudioMount | null,
  lensMount: StudioMount | null,
) {
  const lensLabel = lensMount?.shortName ?? lensMount?.name ?? "Lens mount";
  const bodyLabel = bodyMount?.shortName ?? bodyMount?.name ?? "Body mount";

  return `${lensLabel} -> ${bodyLabel} adapter`;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel">
      <p className="eyebrow">{label}</p>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}

function SelectionCard({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  options: Array<{ id: string; label?: string; displayName?: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="eyebrow">{label}</span>
      <select
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label ?? option.displayName ?? option.id}
          </option>
        ))}
      </select>
    </label>
  );
}
