"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  useTransition,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";

import type {
  StudioAdapterSpec,
  StudioBodySpec,
  StudioDashboardData,
  StudioLensSpec,
  StudioMount,
  StudioMountConversion,
  StudioProduct,
  StudioProductAsset,
} from "@/lib/studio-data";

type StudioDashboardProps = {
  data: StudioDashboardData;
  view?: StudioDashboardView;
};

export type StudioDashboardView =
  | "cameras"
  | "lenses"
  | "adapters"
  | "mounts"
  | "conversions"
  | "assets"
  | "preview";

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

type ConversionFormState = {
  bodyMountId: string;
  lensMountId: string;
  preferredDisplayName: string;
  theoreticalExtensionMm: string;
  linkedAdapterProductIds: string[];
  defaultAdapterProductId: string;
};

type ProductKind = "camera_body" | "lens" | "adapter";

type ProductFormState = {
  productType: ProductKind;
  brandId: string;
  systemId: string;
  slug: string;
  name: string;
  displayName: string;
  status: string;
  mountId: string;
  bodyStyle: string;
  sensorFormatId: string;
  lensKind: string;
  imageCircleFormatId: string;
  adapterType: string;
  numbers: Record<string, string>;
};

type AssetFormState = {
  productId: string;
  assetRole: string;
  assetView: string;
  lensHoodState: string;
  storageBucket: string;
  storagePath: string;
  sourceName: string;
  sourceUrl: string;
  licenseNotes: string;
  approvalStatus: string;
  backgroundRemoved: boolean;
  calibrated: boolean;
  pixelsPerMm: string;
};

type Notice = {
  tone: "error" | "success";
  message: string;
};

const NO_ADAPTER_ID = "__native__";

export function StudioDashboard({ data, view = "cameras" }: StudioDashboardProps) {
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

  const adapterMountEdgesByConversionId = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const edge of data.adapterMountEdges) {
      const current = map.get(edge.mountConversionId) ?? [];
      current.push(edge.adapterProductId);
      map.set(edge.mountConversionId, current);
    }

    return map;
  }, [data.adapterMountEdges]);

  const initialSelection = useMemo(() => getInitialSelection(data), [data]);

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
    <div className="h-full min-h-0">
      {view === "preview" ? (
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Bodies" value={String(data.bodies.length)} />
          <MetricCard label="Lenses" value={String(data.lenses.length)} />
          <MetricCard label="Adapters" value={String(data.adapters.length)} />
        </section>
      ) : null}

      {view === "preview" ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="panel space-y-6">
          <div className="space-y-2">
            <p className="eyebrow">Local Preview</p>
            <h2 className="text-2xl font-semibold text-ink">
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

          <div className="rounded-md border border-border bg-panel p-4 text-sm text-muted">
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

          <div className="rounded-md border border-border bg-panel-strong p-5">
            <p className="eyebrow">Resolution</p>
            {selectedBody && selectedLens && resolution ? (
              <div className="mt-3 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {selectedBody.displayName}
                  </h3>
                  <p className="text-sm text-muted">{selectedLens.displayName}</p>
                </div>

                <div className="rounded-md border border-border bg-panel p-4">
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
            <h2 className="text-xl font-semibold text-ink">
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
                  className="rounded-md border border-border bg-panel p-4"
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
      ) : null}

      {view === "conversions" ? (
      <MountConversionAdmin
        data={data}
        mountsById={mountsById}
        adaptersById={adaptersById}
        mountConversionDefaultsById={mountConversionDefaultsById}
        adapterMountEdgesByConversionId={adapterMountEdgesByConversionId}
      />
      ) : null}

      {view === "cameras" || view === "lenses" || view === "adapters" ? (
        <ProductAdmin data={data} productType={viewToProductKind(view)} />
      ) : null}

      {view === "assets" ? <AssetAdmin data={data} /> : null}

      {view === "mounts" ? <MountsAdmin data={data} /> : null}
    </div>
  );
}

function viewToProductKind(view: StudioDashboardView): ProductKind {
  if (view === "lenses") {
    return "lens";
  }

  if (view === "adapters") {
    return "adapter";
  }

  return "camera_body";
}

function MountsAdmin({ data }: { data: StudioDashboardData }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="panel space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">Mounts</p>
          <h2 className="text-2xl font-semibold text-ink">
            Native connection points
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Mount editing should stay deliberate because compatibility and
            adapter conversions depend on these records.
          </p>
        </div>
      </div>

      <div className="panel space-y-3">
        {data.mounts.map((mount) => (
          <div
            key={mount.id}
            className="rounded-md border border-border bg-panel p-4"
          >
            <p className="text-base font-semibold text-ink">{mount.name}</p>
            <p className="mt-1 text-sm text-muted">
              Short name: {mount.shortName ?? "Not set"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductAdmin({
  data,
  productType,
}: {
  data: StudioDashboardData;
  productType: ProductKind;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const bodySpecsById = useMemo(
    () => new Map(data.bodySpecs.map((spec) => [spec.productId, spec])),
    [data.bodySpecs],
  );
  const lensSpecsById = useMemo(
    () => new Map(data.lensSpecs.map((spec) => [spec.productId, spec])),
    [data.lensSpecs],
  );
  const adapterSpecsById = useMemo(
    () => new Map(data.adapterSpecs.map((spec) => [spec.productId, spec])),
    [data.adapterSpecs],
  );

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        <div>
          <p className="text-sm font-medium text-ink">{formatProductKind(productType)}</p>
          <p className="text-xs text-muted">Catalog records</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-50"
          onClick={() => setCreateOpen(true)}
        >
          Add
        </button>
      </div>

      <CreateProductDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        data={data}
        productType={productType}
      />

      <div className="min-h-0 flex-1">
      {productType === "camera_body" ? (
        <ProductGroup
          title="Cameras"
          products={data.bodies}
          productType="camera_body"
          data={data}
          specsById={bodySpecsById}
        />
      ) : null}
      {productType === "lens" ? (
        <ProductGroup
          title="Lenses"
          products={data.lenses}
          productType="lens"
          data={data}
          specsById={lensSpecsById}
        />
      ) : null}
      {productType === "adapter" ? (
        <ProductGroup
          title="Adapters"
          products={data.adapters}
          productType="adapter"
          data={data}
          specsById={adapterSpecsById}
        />
      ) : null}
      </div>
    </section>
  );
}

function CreateProductDialog({
  open,
  onClose,
  data,
  productType,
}: {
  open: boolean;
  onClose: () => void;
  data: StudioDashboardData;
  productType: ProductKind;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<ProductFormState>(() =>
    getInitialProductFormState(productType, data),
  );

  async function handleCreate() {
    setNotice(null);

    const response = await fetch("/api/studio/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(serializeProductForm(form)),
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setNotice({
        tone: "error",
        message: result.message ?? "Failed to create product.",
      });
      return;
    }

    setForm(getInitialProductFormState(form.productType, data));
    setNotice(null);
    onClose();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <ModalFrame
      open={open}
      title={`Add ${formatProductKind(productType)}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-sm font-medium text-ink"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-50"
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ProductFormFields form={form} setForm={setForm} data={data} lockType />
        {notice ? <NoticeBanner notice={notice} /> : null}
      </div>
    </ModalFrame>
  );
}

function ProductGroup<TSpec extends StudioBodySpec | StudioLensSpec | StudioAdapterSpec>({
  title,
  products,
  productType,
  data,
  specsById,
}: {
  title: string;
  products: StudioProduct[];
  productType: ProductKind;
  data: StudioDashboardData;
  specsById: Map<string, TSpec>;
}) {
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const filteredProducts = products.filter((product) =>
    [product.displayName, product.name, product.slug]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const selectedProduct =
    filteredProducts.find((product) => product.id === selectedProductId) ??
    filteredProducts[0] ??
    null;

  return (
    <div className="grid h-full min-h-0 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex min-h-0 flex-col border-r border-border bg-surface">
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">List</p>
            <h3 className="mt-1 text-xl font-semibold text-ink">{title}</h3>
          </div>
          <span className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted">
            {filteredProducts.length}/{products.length}
          </span>
        </div>

        <TextField label="Search" value={query} onChange={setQuery} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredProducts.map((product) => {
            const selected = product.id === selectedProduct?.id;

            return (
              <button
                key={product.id}
                type="button"
                className={
                  selected
                    ? "w-full border-b border-border bg-panel-strong px-4 py-3 text-left"
                    : "w-full border-b border-border bg-surface px-4 py-3 text-left hover:bg-panel-strong"
                }
                onClick={() => setSelectedProductId(product.id)}
              >
                <span className="block text-sm font-semibold text-ink">
                  {product.displayName}
                </span>
                <span className="mt-1 block text-xs text-muted">{product.slug}</span>
              </button>
            );
          })}

          {filteredProducts.length === 0 ? (
            <div className="p-4 text-sm text-muted">
              No matching records.
            </div>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 min-w-0 overflow-y-auto bg-background">
        {selectedProduct ? (
          <ProductEditorCard
            key={buildProductKey(selectedProduct, specsById.get(selectedProduct.id), data)}
            product={selectedProduct}
            productType={productType}
            data={data}
            spec={specsById.get(selectedProduct.id) ?? null}
          />
        ) : (
          <div className="p-4 text-sm text-muted">Select a record to edit.</div>
        )}
      </div>
    </div>
  );
}

function ProductEditorCard({
  product,
  productType,
  data,
  spec,
}: {
  product: StudioProduct;
  productType: ProductKind;
  data: StudioDashboardData;
  spec: StudioBodySpec | StudioLensSpec | StudioAdapterSpec | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<ProductFormState>(() =>
    getProductFormState(product, productType, data, spec),
  );

  async function handleSave() {
    setNotice(null);

    const response = await fetch(`/api/studio/products/${product.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(serializeProductForm(form)),
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setNotice({
        tone: "error",
        message: result.message ?? "Failed to save product.",
      });
      return;
    }

    setNotice({
      tone: "success",
      message: "Saved product.",
    });
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleDelete() {
    setNotice(null);

    const response = await fetch(`/api/studio/products/${product.id}`, {
      method: "DELETE",
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setNotice({
        tone: "error",
        message: result.message ?? "Failed to delete product.",
      });
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <details open className="min-h-full bg-surface">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">{formatProductKind(productType)}</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">
              {product.displayName}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {formatProductMount(product, productType, data)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onClick={(event) => {
                event.preventDefault();
                void handleSave();
              }}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-panel px-3 py-1.5 text-sm font-medium text-muted disabled:cursor-not-allowed disabled:opacity-50"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isPending}
            >
              Delete
            </button>
          </div>
        </div>
      </summary>

      <div className="space-y-5 p-5">
        <ProductFormFields form={form} setForm={setForm} data={data} lockType />
        <ProductMediaPanel productId={product.id} data={data} />
        {notice ? <NoticeBanner notice={notice} /> : null}
      </div>
    </details>
  );
}

function ProductMediaPanel({
  productId,
  data,
}: {
  productId: string;
  data: StudioDashboardData;
}) {
  const assets = data.productAssets.filter((asset) => asset.productId === productId);

  return (
    <div className="rounded-md border border-border bg-panel-strong p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Media</p>
          <h4 className="mt-1 text-base font-semibold text-ink">Attached assets</h4>
        </div>
        <span className="rounded-md border border-border bg-panel px-3 py-1 text-xs font-medium text-muted">
          {assets.length}
        </span>
      </div>

      {assets.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No media records yet. Add images from the Assets section.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex gap-3 rounded-md border border-border bg-panel p-3"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-panel-strong">
                <Image
                  src={`/api/studio/assets/${asset.id}/file`}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium text-ink">{asset.assetView}</p>
                <p className="mt-1 truncate text-muted">{asset.lensHoodState}</p>
                <p className="mt-1 truncate text-muted">{asset.approvalStatus}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductFormFields({
  form,
  setForm,
  data,
  lockType = false,
}: {
  form: ProductFormState;
  setForm: Dispatch<SetStateAction<ProductFormState>>;
  data: StudioDashboardData;
  lockType?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <SelectionCard
          label="Type"
          value={form.productType}
          onChange={(nextValue) =>
            setForm((current) => ({
              ...getInitialProductFormState(nextValue as ProductKind, data),
              brandId: current.brandId,
              systemId: current.systemId,
            }))
          }
          options={[
            { id: "camera_body", label: "Camera body" },
            { id: "lens", label: "Lens" },
            { id: "adapter", label: "Adapter" },
          ]}
          disabled={lockType}
        />
        <SelectionCard
          label="Brand"
          value={form.brandId}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, brandId: nextValue }))
          }
          options={data.brands.map((brand) => ({
            id: brand.id,
            label: brand.name,
          }))}
        />
        <SelectionCard
          label="System"
          value={form.systemId}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, systemId: nextValue }))
          }
          options={[
            { id: "", label: "None" },
            ...data.systems.map((system) => ({
              id: system.id,
              label: system.name,
            })),
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Name"
          value={form.name}
          onChange={(nextValue) =>
            setForm((current) => ({
              ...current,
              name: nextValue,
              displayName: current.displayName || nextValue,
              slug: current.slug || slugify(nextValue),
            }))
          }
        />
        <TextField
          label="Display name"
          value={form.displayName}
          onChange={(nextValue) =>
            setForm((current) => ({
              ...current,
              displayName: nextValue,
              slug: current.slug || slugify(nextValue),
            }))
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TextField
          label="Slug"
          value={form.slug}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, slug: slugify(nextValue) }))
          }
        />
        <SelectionCard
          label="Status"
          value={form.status}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, status: nextValue }))
          }
          options={[
            { id: "draft", label: "Draft" },
            { id: "active", label: "Active" },
            { id: "discontinued", label: "Discontinued" },
            { id: "archived", label: "Archived" },
          ]}
        />
        {form.productType === "adapter" ? (
          <SelectionCard
            label="Adapter type"
            value={form.adapterType}
            onChange={(nextValue) =>
              setForm((current) => ({ ...current, adapterType: nextValue }))
            }
            options={[
              { id: "mechanical", label: "Mechanical" },
              { id: "electronic", label: "Electronic" },
              { id: "optical", label: "Optical" },
              { id: "teleconverter", label: "Teleconverter" },
              { id: "speed_booster", label: "Speed booster" },
            ]}
          />
        ) : (
          <MountSelectionField
            label="Native mount"
            value={form.mountId}
            onChange={(nextValue) =>
              setForm((current) => ({ ...current, mountId: nextValue }))
            }
            mounts={data.mounts}
          />
        )}
      </div>

      {form.productType === "camera_body" ? (
        <BodyFields form={form} setForm={setForm} data={data} />
      ) : null}
      {form.productType === "lens" ? (
        <LensFields form={form} setForm={setForm} data={data} />
      ) : null}
      {form.productType === "adapter" ? (
        <AdapterFields form={form} setForm={setForm} />
      ) : null}
    </div>
  );
}

function AssetAdmin({ data }: { data: StudioDashboardData }) {
  const [createOpen, setCreateOpen] = useState(false);
  const products = useMemo(
    () => [...data.bodies, ...data.lenses, ...data.adapters],
    [data.adapters, data.bodies, data.lenses],
  );
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const [query, setQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState(
    data.productAssets[0]?.id ?? "",
  );
  const filteredAssets = data.productAssets.filter((asset) => {
    const product = productsById.get(asset.productId);

    return [
      product?.displayName ?? "",
      asset.assetView,
      asset.assetRole,
      asset.lensHoodState,
      asset.approvalStatus,
      asset.storagePath,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });
  const selectedAsset =
    filteredAssets.find((asset) => asset.id === selectedAssetId) ??
    filteredAssets[0] ??
    null;

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        <div>
          <p className="text-sm font-medium text-ink">Assets</p>
          <p className="text-xs text-muted">Media records and approvals</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-foreground"
          onClick={() => setCreateOpen(true)}
        >
          Add
        </button>
      </div>

      <CreateAssetDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        data={data}
        products={products}
      />

      <div className="grid min-h-0 flex-1 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col border-r border-border bg-surface">
          <div className="space-y-3 border-b border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">List</p>
                <h3 className="mt-1 text-xl font-semibold text-ink">Assets</h3>
              </div>
              <span className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted">
                {filteredAssets.length}/{data.productAssets.length}
              </span>
            </div>
            <TextField label="Search" value={query} onChange={setQuery} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
          {data.productAssets.length === 0 ? (
            <div className="p-4 text-sm text-muted">
              No assets tracked yet.
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-4 text-sm text-muted">No matching records.</div>
          ) : (
            filteredAssets.map((asset) => {
              const product = productsById.get(asset.productId) ?? null;
              const selected = asset.id === selectedAsset?.id;

              return (
                <button
                  key={asset.id}
                  type="button"
                  className={
                    selected
                      ? "w-full border-b border-border bg-panel-strong px-4 py-3 text-left"
                      : "w-full border-b border-border bg-surface px-4 py-3 text-left hover:bg-panel-strong"
                  }
                  onClick={() => setSelectedAssetId(asset.id)}
                >
                  <span className="block truncate text-sm font-semibold text-ink">
                    {product?.displayName ?? "Unknown product"}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">
                    {asset.assetView} / {asset.lensHoodState} / {asset.approvalStatus}
                  </span>
                </button>
              );
            })
          )}
          </div>
        </div>

        <div className="min-h-0 min-w-0 overflow-y-auto bg-background">
          {selectedAsset ? (
            <AssetEditorCard
              key={buildAssetKey(selectedAsset)}
              asset={selectedAsset}
              products={products}
              product={productsById.get(selectedAsset.productId) ?? null}
            />
          ) : (
            <div className="p-4 text-sm text-muted">Select a record to edit.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function CreateAssetDialog({
  open,
  onClose,
  data,
  products,
}: {
  open: boolean;
  onClose: () => void;
  data: StudioDashboardData;
  products: StudioProduct[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<AssetFormState>(() =>
    getInitialAssetFormState(data, products),
  );

  async function handleCreate() {
    setNotice(null);

    const response = await fetch("/api/studio/assets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(serializeAssetForm(form)),
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setNotice({
        tone: "error",
        message: result.message ?? "Failed to create asset.",
      });
      return;
    }

    setForm(getInitialAssetFormState(data, products));
    setNotice(null);
    onClose();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <ModalFrame
      open={open}
      title="Add Asset"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-sm font-medium text-ink"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-50"
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
      <AssetFormFields form={form} setForm={setForm} products={products} />
      {notice ? <NoticeBanner notice={notice} /> : null}
      </div>
    </ModalFrame>
  );
}

function AssetEditorCard({
  asset,
  products,
  product,
}: {
  asset: StudioProductAsset;
  products: StudioProduct[];
  product: StudioProduct | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<AssetFormState>(() => getAssetFormState(asset));

  async function handleSave() {
    setNotice(null);

    const response = await fetch(`/api/studio/assets/${asset.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(serializeAssetForm(form)),
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setNotice({
        tone: "error",
        message: result.message ?? "Failed to save asset.",
      });
      return;
    }

    setNotice({
      tone: "success",
      message: "Saved asset.",
    });
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleDelete() {
    setNotice(null);

    const response = await fetch(`/api/studio/assets/${asset.id}`, {
      method: "DELETE",
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setNotice({
        tone: "error",
        message: result.message ?? "Failed to delete asset.",
      });
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <details open className="min-h-full bg-surface">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-panel-strong">
              <Image
                src={`/api/studio/assets/${asset.id}/file`}
                alt=""
                width={96}
                height={96}
                unoptimized
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="eyebrow">{asset.approvalStatus}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">
                {product?.displayName ?? "Unknown product"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {asset.assetView} / {asset.assetRole} / {asset.lensHoodState}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-md border border-border bg-panel px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50"
              onClick={(event) => {
                event.preventDefault();
                void handleSave();
              }}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-panel px-4 py-2 text-sm font-medium text-muted disabled:cursor-not-allowed disabled:opacity-50"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isPending}
            >
              Delete
            </button>
          </div>
        </div>
      </summary>

      <div className="space-y-4 p-5">
        <AssetFormFields form={form} setForm={setForm} products={products} />
        {notice ? <NoticeBanner notice={notice} /> : null}
      </div>
    </details>
  );
}

function BodyFields({
  form,
  setForm,
  data,
}: {
  form: ProductFormState;
  setForm: Dispatch<SetStateAction<ProductFormState>>;
  data: StudioDashboardData;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SelectionCard
        label="Body style"
        value={form.bodyStyle}
        onChange={(nextValue) =>
          setForm((current) => ({ ...current, bodyStyle: nextValue }))
        }
        options={[
          { id: "mirrorless", label: "Mirrorless" },
          { id: "rangefinder", label: "Rangefinder" },
          { id: "dslr", label: "DSLR" },
          { id: "compact", label: "Compact" },
          { id: "medium_format", label: "Medium format" },
          { id: "fixed_lens", label: "Fixed lens" },
          { id: "cine", label: "Cine" },
        ]}
      />
      <SelectionCard
        label="Sensor"
        value={form.sensorFormatId}
        onChange={(nextValue) =>
          setForm((current) => ({ ...current, sensorFormatId: nextValue }))
        }
        options={[
          { id: "", label: "Unknown" },
          ...data.sensorFormats.map((sensorFormat) => ({
            id: sensorFormat.id,
            label: sensorFormat.name,
          })),
        ]}
      />
      <NumberField
        label="Weight (g)"
        value={form.numbers.weightG ?? ""}
        onChange={(nextValue) => updateNumberField(setForm, "weightG", nextValue)}
      />
      <NumberField
        label="Width (mm)"
        value={form.numbers.widthMm ?? ""}
        onChange={(nextValue) => updateNumberField(setForm, "widthMm", nextValue)}
      />
      <NumberField
        label="Height (mm)"
        value={form.numbers.heightMm ?? ""}
        onChange={(nextValue) => updateNumberField(setForm, "heightMm", nextValue)}
      />
      <NumberField
        label="Depth (mm)"
        value={form.numbers.depthMm ?? ""}
        onChange={(nextValue) => updateNumberField(setForm, "depthMm", nextValue)}
      />
    </div>
  );
}

function LensFields({
  form,
  setForm,
  data,
}: {
  form: ProductFormState;
  setForm: Dispatch<SetStateAction<ProductFormState>>;
  data: StudioDashboardData;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SelectionCard
        label="Lens kind"
        value={form.lensKind}
        onChange={(nextValue) =>
          setForm((current) => ({ ...current, lensKind: nextValue }))
        }
        options={[
          { id: "prime", label: "Prime" },
          { id: "zoom", label: "Zoom" },
          { id: "teleconverter", label: "Teleconverter" },
          { id: "extender", label: "Extender" },
        ]}
      />
      <SelectionCard
        label="Image circle"
        value={form.imageCircleFormatId}
        onChange={(nextValue) =>
          setForm((current) => ({ ...current, imageCircleFormatId: nextValue }))
        }
        options={[
          { id: "", label: "Unknown" },
          ...data.sensorFormats.map((sensorFormat) => ({
            id: sensorFormat.id,
            label: sensorFormat.name,
          })),
        ]}
      />
      <NumberField
        label="Weight (g)"
        value={form.numbers.weightG ?? ""}
        onChange={(nextValue) => updateNumberField(setForm, "weightG", nextValue)}
      />
      <NumberField
        label="Focal min (mm)"
        value={form.numbers.focalLengthMinMm ?? ""}
        onChange={(nextValue) =>
          updateNumberField(setForm, "focalLengthMinMm", nextValue)
        }
      />
      <NumberField
        label="Focal max (mm)"
        value={form.numbers.focalLengthMaxMm ?? ""}
        onChange={(nextValue) =>
          updateNumberField(setForm, "focalLengthMaxMm", nextValue)
        }
      />
      <NumberField
        label="Max aperture"
        value={form.numbers.maxApertureWide ?? ""}
        onChange={(nextValue) =>
          updateNumberField(setForm, "maxApertureWide", nextValue)
        }
      />
      <NumberField
        label="Tele aperture"
        value={form.numbers.maxApertureTele ?? ""}
        onChange={(nextValue) =>
          updateNumberField(setForm, "maxApertureTele", nextValue)
        }
      />
      <NumberField
        label="Diameter (mm)"
        value={form.numbers.diameterMm ?? ""}
        onChange={(nextValue) => updateNumberField(setForm, "diameterMm", nextValue)}
      />
      <NumberField
        label="Length (mm)"
        value={form.numbers.lengthMm ?? ""}
        onChange={(nextValue) => updateNumberField(setForm, "lengthMm", nextValue)}
      />
      <NumberField
        label="Filter (mm)"
        value={form.numbers.filterThreadMm ?? ""}
        onChange={(nextValue) =>
          updateNumberField(setForm, "filterThreadMm", nextValue)
        }
      />
    </div>
  );
}

function AdapterFields({
  form,
  setForm,
}: {
  form: ProductFormState;
  setForm: Dispatch<SetStateAction<ProductFormState>>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <NumberField
        label="Added length (mm)"
        value={form.numbers.addsLengthMm ?? ""}
        onChange={(nextValue) =>
          updateNumberField(setForm, "addsLengthMm", nextValue)
        }
      />
      <NumberField
        label="Added weight (g)"
        value={form.numbers.addsWeightG ?? ""}
        onChange={(nextValue) => updateNumberField(setForm, "addsWeightG", nextValue)}
      />
    </div>
  );
}

function AssetFormFields({
  form,
  setForm,
  products,
}: {
  form: AssetFormState;
  setForm: Dispatch<SetStateAction<AssetFormState>>;
  products: StudioProduct[];
}) {
  const [uploadNotice, setUploadNotice] = useState<Notice | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileUpload(file: File | null) {
    if (!file) {
      return;
    }

    setUploadNotice(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("productId", form.productId);
    formData.set("assetRole", form.assetRole);
    formData.set("assetView", form.assetView);
    formData.set("lensHoodState", form.lensHoodState);

    const response = await fetch("/api/studio/assets/upload", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      storageBucket?: string;
      storagePath?: string;
    };

    setIsUploading(false);

    if (!response.ok || !result.ok || !result.storageBucket || !result.storagePath) {
      setUploadNotice({
        tone: "error",
        message: result.message ?? "Failed to upload image.",
      });
      return;
    }

    setForm((current) => ({
      ...current,
      storageBucket: result.storageBucket ?? current.storageBucket,
      storagePath: result.storagePath ?? current.storagePath,
    }));
    setUploadNotice({
      tone: "success",
      message: "Uploaded image and filled storage path.",
    });
  }

  return (
    <div className="space-y-4">
      <SelectionCard
        label="Product"
        value={form.productId}
        onChange={(nextValue) =>
          setForm((current) => ({ ...current, productId: nextValue }))
        }
        options={products.map((product) => ({
          id: product.id,
          label: product.displayName,
        }))}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SelectionCard
          label="Role"
          value={form.assetRole}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, assetRole: nextValue }))
          }
          options={[
            { id: "reference", label: "Reference" },
            { id: "calibrated_cutout", label: "Calibrated cutout" },
            { id: "thumbnail", label: "Thumbnail" },
            { id: "overlay", label: "Overlay" },
          ]}
        />
        <SelectionCard
          label="View"
          value={form.assetView}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, assetView: nextValue }))
          }
          options={[
            { id: "front", label: "Front" },
            { id: "rear", label: "Rear" },
            { id: "top", label: "Top" },
            { id: "left", label: "Left" },
            { id: "right", label: "Right" },
            { id: "mount_front", label: "Mount front" },
            { id: "mount_rear", label: "Mount rear" },
            { id: "three_quarter", label: "Three quarter" },
          ]}
        />
        <SelectionCard
          label="Lens hood"
          value={form.lensHoodState}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, lensHoodState: nextValue }))
          }
          options={[
            { id: "not_applicable", label: "Not applicable" },
            { id: "unknown", label: "Unknown" },
            { id: "without_hood", label: "Without hood" },
            { id: "with_hood", label: "With hood" },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="eyebrow">Upload image</span>
          <input
            className="field"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={isUploading || !form.productId}
            onChange={(event) => {
              void handleFileUpload(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </label>
        <TextField
          label="Storage bucket"
          value={form.storageBucket}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, storageBucket: nextValue }))
          }
        />
        <TextField
          label="Storage path"
          value={form.storagePath}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, storagePath: nextValue }))
          }
        />
      </div>

      {uploadNotice ? <NoticeBanner notice={uploadNotice} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Source name"
          value={form.sourceName}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, sourceName: nextValue }))
          }
        />
        <TextField
          label="Source URL"
          value={form.sourceUrl}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, sourceUrl: nextValue }))
          }
        />
      </div>

      <TextField
        label="License notes"
        value={form.licenseNotes}
        onChange={(nextValue) =>
          setForm((current) => ({ ...current, licenseNotes: nextValue }))
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SelectionCard
          label="Approval"
          value={form.approvalStatus}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, approvalStatus: nextValue }))
          }
          options={[
            { id: "draft", label: "Draft" },
            { id: "needs_review", label: "Needs review" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
          ]}
        />
        <NumberField
          label="Pixels per mm"
          value={form.pixelsPerMm}
          onChange={(nextValue) =>
            setForm((current) => ({ ...current, pixelsPerMm: nextValue }))
          }
        />
        <div className="grid gap-3 pt-6">
          <BooleanField
            label="Background removed"
            checked={form.backgroundRemoved}
            onChange={(nextValue) =>
              setForm((current) => ({ ...current, backgroundRemoved: nextValue }))
            }
          />
          <BooleanField
            label="Calibrated"
            checked={form.calibrated}
            onChange={(nextValue) =>
              setForm((current) => ({ ...current, calibrated: nextValue }))
            }
          />
        </div>
      </div>
    </div>
  );
}

function MountConversionAdmin({
  data,
  mountsById,
  adaptersById,
  mountConversionDefaultsById,
  adapterMountEdgesByConversionId,
}: {
  data: StudioDashboardData;
  mountsById: Map<string, StudioMount>;
  adaptersById: Map<string, StudioProduct>;
  mountConversionDefaultsById: Map<string, string>;
  adapterMountEdgesByConversionId: Map<string, string[]>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedConversionId, setSelectedConversionId] = useState(
    data.mountConversions[0]?.id ?? "",
  );
  const filteredConversions = data.mountConversions.filter((conversion) => {
    const bodyMount = mountsById.get(conversion.bodyMountId) ?? null;
    const lensMount = mountsById.get(conversion.lensMountId) ?? null;

    return [
      conversion.preferredDisplayName ?? "",
      formatGenericConversion(bodyMount, lensMount),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });
  const selectedConversion =
    filteredConversions.find((conversion) => conversion.id === selectedConversionId) ??
    filteredConversions[0] ??
    null;

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        <div>
          <p className="text-sm font-medium text-ink">Conversions</p>
          <p className="text-xs text-muted">Generic adapter paths and defaults</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-foreground"
          onClick={() => setCreateOpen(true)}
        >
          Add
        </button>
      </div>

      <CreateMountConversionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        data={data}
        mountsById={mountsById}
      />

      <div className="grid min-h-0 flex-1 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col border-r border-border bg-surface">
          <div className="space-y-3 border-b border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">List</p>
                <h3 className="mt-1 text-xl font-semibold text-ink">Conversions</h3>
              </div>
              <span className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted">
                {filteredConversions.length}/{data.mountConversions.length}
              </span>
            </div>
            <TextField label="Search" value={query} onChange={setQuery} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredConversions.length === 0 ? (
              <div className="p-4 text-sm text-muted">No matching records.</div>
            ) : (
              filteredConversions.map((conversion) => {
                const bodyMount = mountsById.get(conversion.bodyMountId) ?? null;
                const lensMount = mountsById.get(conversion.lensMountId) ?? null;
                const selected = conversion.id === selectedConversion?.id;

                return (
                  <button
                    key={conversion.id}
                    type="button"
                    className={
                      selected
                        ? "w-full border-b border-border bg-panel-strong px-4 py-3 text-left"
                        : "w-full border-b border-border bg-surface px-4 py-3 text-left hover:bg-panel-strong"
                    }
                    onClick={() => setSelectedConversionId(conversion.id)}
                  >
                    <span className="block truncate text-sm font-semibold text-ink">
                      {conversion.preferredDisplayName ??
                        formatGenericConversion(bodyMount, lensMount)}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {conversion.theoreticalExtensionMm ?? "Unknown"} mm extension
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="min-h-0 min-w-0 overflow-y-auto bg-background">
          {selectedConversion ? (() => {
            const conversion = selectedConversion;
            const linkedAdapterProductIds =
              adapterMountEdgesByConversionId.get(conversion.id) ?? [];
            const defaultAdapterProductId =
              mountConversionDefaultsById.get(conversion.id) ?? null;

            return (
              <MountConversionEditorCard
                key={buildConversionKey(
                  conversion,
                  linkedAdapterProductIds,
                  defaultAdapterProductId,
                )}
                conversion={conversion}
                mounts={data.mounts}
                mountsById={mountsById}
                adapters={data.adapters}
                adaptersById={adaptersById}
                linkedAdapterProductIds={linkedAdapterProductIds}
                defaultAdapterProductId={defaultAdapterProductId}
              />
            );
          })() : (
            <div className="p-4 text-sm text-muted">Select a conversion to edit.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function CreateMountConversionDialog({
  open,
  onClose,
  data,
  mountsById,
}: {
  open: boolean;
  onClose: () => void;
  data: StudioDashboardData;
  mountsById: Map<string, StudioMount>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<ConversionFormState>(() =>
    getInitialConversionFormState(data.mounts),
  );

  const linkedAdapters = data.adapters.filter((adapter) =>
    form.linkedAdapterProductIds.includes(adapter.id),
  );

  async function handleCreate() {
    setNotice(null);

    const response = await fetch("/api/studio/mount-conversions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bodyMountId: form.bodyMountId,
        lensMountId: form.lensMountId,
        preferredDisplayName: form.preferredDisplayName,
        theoreticalExtensionMm: form.theoreticalExtensionMm,
        linkedAdapterProductIds: form.linkedAdapterProductIds,
        defaultAdapterProductId: form.defaultAdapterProductId || null,
      }),
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setNotice({
        tone: "error",
        message: result.message ?? "Failed to create mount conversion.",
      });
      return;
    }

    setForm(getInitialConversionFormState(data.mounts));
    setNotice(null);
    onClose();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <ModalFrame
      open={open}
      title="Add Conversion"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-sm font-medium text-ink"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-50"
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <MountSelectionField
          label="Body mount"
          value={form.bodyMountId}
          onChange={(nextValue) => {
            setForm((current) => ({ ...current, bodyMountId: nextValue }));
          }}
          mounts={data.mounts}
        />
        <MountSelectionField
          label="Lens mount"
          value={form.lensMountId}
          onChange={(nextValue) => {
            setForm((current) => ({ ...current, lensMountId: nextValue }));
          }}
          mounts={data.mounts}
        />
      </div>

      <label className="space-y-2">
        <span className="eyebrow">Display name</span>
        <input
          className="field"
          placeholder={`Optional, for example ${formatGenericConversion(
            mountsById.get(form.bodyMountId) ?? null,
            mountsById.get(form.lensMountId) ?? null,
          )}`}
          value={form.preferredDisplayName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              preferredDisplayName: event.target.value,
            }))
          }
        />
      </label>

      <label className="space-y-2">
        <span className="eyebrow">Theoretical extension (mm)</span>
        <input
          className="field"
          inputMode="decimal"
          placeholder="Optional"
          value={form.theoreticalExtensionMm}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              theoreticalExtensionMm: event.target.value,
            }))
          }
        />
      </label>

      <AdapterChecklist
        adapters={data.adapters}
        linkedAdapterProductIds={form.linkedAdapterProductIds}
        onToggle={(adapterId) => {
          setForm((current) => {
            const nextLinkedIds = current.linkedAdapterProductIds.includes(adapterId)
              ? current.linkedAdapterProductIds.filter((id) => id !== adapterId)
              : [...current.linkedAdapterProductIds, adapterId];

            return {
              ...current,
              linkedAdapterProductIds: nextLinkedIds,
              defaultAdapterProductId: nextLinkedIds.includes(
                current.defaultAdapterProductId,
              )
                ? current.defaultAdapterProductId
                : "",
            };
          });
        }}
      />

      <SelectionCard
        label="Default real adapter"
        value={form.defaultAdapterProductId}
        onChange={(nextValue) =>
          setForm((current) => ({
            ...current,
            defaultAdapterProductId: nextValue,
          }))
        }
        options={[
          { id: "", label: "None selected yet" },
          ...linkedAdapters,
        ]}
        disabled={linkedAdapters.length === 0}
      />

      {notice ? <NoticeBanner notice={notice} /> : null}
      </div>
    </ModalFrame>
  );
}

function MountConversionEditorCard({
  conversion,
  mounts,
  mountsById,
  adapters,
  adaptersById,
  linkedAdapterProductIds,
  defaultAdapterProductId,
}: {
  conversion: StudioMountConversion;
  mounts: StudioMount[];
  mountsById: Map<string, StudioMount>;
  adapters: StudioProduct[];
  adaptersById: Map<string, StudioProduct>;
  linkedAdapterProductIds: string[];
  defaultAdapterProductId: null | string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<ConversionFormState>({
    bodyMountId: conversion.bodyMountId,
    lensMountId: conversion.lensMountId,
    preferredDisplayName: conversion.preferredDisplayName ?? "",
    theoreticalExtensionMm:
      conversion.theoreticalExtensionMm != null
        ? String(conversion.theoreticalExtensionMm)
        : "",
    linkedAdapterProductIds,
    defaultAdapterProductId: defaultAdapterProductId ?? "",
  });

  const linkedAdapters = adapters.filter((adapter) =>
    form.linkedAdapterProductIds.includes(adapter.id),
  );

  const currentDefaultAdapter = defaultAdapterProductId
    ? adaptersById.get(defaultAdapterProductId) ?? null
    : null;

  async function handleSave() {
    setNotice(null);

    const response = await fetch(`/api/studio/mount-conversions/${conversion.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bodyMountId: form.bodyMountId,
        lensMountId: form.lensMountId,
        preferredDisplayName: form.preferredDisplayName,
        theoreticalExtensionMm: form.theoreticalExtensionMm,
        linkedAdapterProductIds: form.linkedAdapterProductIds,
        defaultAdapterProductId: form.defaultAdapterProductId || null,
      }),
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setNotice({
        tone: "error",
        message: result.message ?? "Failed to update mount conversion.",
      });
      return;
    }

    setNotice({
      tone: "success",
      message: "Saved mount conversion.",
    });
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleDelete() {
    setNotice(null);

    const response = await fetch(`/api/studio/mount-conversions/${conversion.id}`, {
      method: "DELETE",
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setNotice({
        tone: "error",
        message: result.message ?? "Failed to delete mount conversion.",
      });
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="min-h-full bg-surface">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Conversion</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">
            {conversion.preferredDisplayName ??
              formatGenericConversion(
                mountsById.get(conversion.bodyMountId) ?? null,
                mountsById.get(conversion.lensMountId) ?? null,
              )}
          </h3>
          <p className="mt-2 text-sm text-muted">
            Current default:{" "}
            <span className="font-medium text-ink">
              {currentDefaultAdapter?.displayName ?? "None"}
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="rounded-md border border-border bg-panel px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-panel px-4 py-2 text-sm font-medium text-muted disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleDelete}
            disabled={isPending}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <MountSelectionField
          label="Body mount"
          value={form.bodyMountId}
          onChange={(nextValue) => {
            setForm((current) => ({ ...current, bodyMountId: nextValue }));
          }}
          mounts={mounts}
        />
        <MountSelectionField
          label="Lens mount"
          value={form.lensMountId}
          onChange={(nextValue) => {
            setForm((current) => ({ ...current, lensMountId: nextValue }));
          }}
          mounts={mounts}
        />
      </div>

      <div className="grid gap-4 px-5 pb-5 md:grid-cols-[minmax(0,1fr)_180px]">
        <label className="space-y-2">
          <span className="eyebrow">Display name</span>
          <input
            className="field"
            placeholder={formatGenericConversion(
              mountsById.get(form.bodyMountId) ?? null,
              mountsById.get(form.lensMountId) ?? null,
            )}
            value={form.preferredDisplayName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                preferredDisplayName: event.target.value,
              }))
            }
          />
        </label>

        <label className="space-y-2">
          <span className="eyebrow">Theoretical extension (mm)</span>
          <input
            className="field"
            inputMode="decimal"
            value={form.theoreticalExtensionMm}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                theoreticalExtensionMm: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="px-5 pb-5">
        <AdapterChecklist
          adapters={adapters}
          linkedAdapterProductIds={form.linkedAdapterProductIds}
          onToggle={(adapterId) => {
            setForm((current) => {
              const nextLinkedIds = current.linkedAdapterProductIds.includes(adapterId)
                ? current.linkedAdapterProductIds.filter((id) => id !== adapterId)
                : [...current.linkedAdapterProductIds, adapterId];

              return {
                ...current,
                linkedAdapterProductIds: nextLinkedIds,
                defaultAdapterProductId: nextLinkedIds.includes(
                  current.defaultAdapterProductId,
                )
                  ? current.defaultAdapterProductId
                  : "",
              };
            });
          }}
        />
      </div>

      <div className="px-5 pb-5">
        <SelectionCard
          label="Default real adapter"
          value={form.defaultAdapterProductId}
          onChange={(nextValue) =>
            setForm((current) => ({
              ...current,
              defaultAdapterProductId: nextValue,
            }))
          }
          options={[
            { id: "", label: "None selected yet" },
            ...linkedAdapters,
          ]}
          disabled={linkedAdapters.length === 0}
        />
      </div>

      {notice ? <div className="px-5 pb-5"><NoticeBanner notice={notice} /></div> : null}
    </div>
  );
}

function MountSelectionField({
  label,
  value,
  onChange,
  mounts,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  mounts: StudioMount[];
}) {
  return (
    <SelectionCard
      label={label}
      value={value}
      onChange={onChange}
      options={mounts.map((mount) => ({
        id: mount.id,
        label: formatMountLabel(mount),
      }))}
    />
  );
}

function AdapterChecklist({
  adapters,
  linkedAdapterProductIds,
  onToggle,
}: {
  adapters: StudioProduct[];
  linkedAdapterProductIds: string[];
  onToggle: (adapterId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="eyebrow">Linked real adapters</p>
      <div className="grid gap-3 md:grid-cols-2">
        {adapters.map((adapter) => {
          const checked = linkedAdapterProductIds.includes(adapter.id);

          return (
            <label
              key={adapter.id}
              className="flex items-start gap-3 rounded-md border border-border bg-panel px-4 py-3"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(adapter.id)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm text-ink">{adapter.displayName}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  return (
    <div
      className={
        notice.tone === "error"
          ? "rounded-md border border-border bg-panel px-4 py-3 text-sm text-danger"
          : "rounded-md border border-border bg-panel px-4 py-3 text-sm text-success"
      }
    >
      {notice.message}
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

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="eyebrow">{label}</span>
      <input
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="eyebrow">{label}</span>
      <input
        className="field"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ModalFrame({
  open,
  title,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-md border border-border bg-surface shadow-xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            className="rounded-md border border-border bg-panel px-2.5 py-1 text-sm text-muted"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-panel px-5 py-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (nextValue: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-border bg-panel px-4 py-3 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}

function getInitialSelection(data: StudioDashboardData) {
  return {
    bodyId: data.bodies[0]?.id ?? "",
    lensId: "",
  };
}

function getInitialConversionFormState(mounts: StudioMount[]): ConversionFormState {
  const bodyMountId = mounts[0]?.id ?? "";
  const lensMountId =
    mounts.find((mount) => mount.id !== bodyMountId)?.id ?? bodyMountId;

  return {
    bodyMountId,
    lensMountId,
    preferredDisplayName: "",
    theoreticalExtensionMm: "",
    linkedAdapterProductIds: [],
    defaultAdapterProductId: "",
  };
}

function getInitialProductFormState(
  productType: ProductKind,
  data: StudioDashboardData,
): ProductFormState {
  return {
    productType,
    brandId: data.brands[0]?.id ?? "",
    systemId: data.systems[0]?.id ?? "",
    slug: "",
    name: "",
    displayName: "",
    status: "draft",
    mountId: data.mounts[0]?.id ?? "",
    bodyStyle: "mirrorless",
    sensorFormatId: data.sensorFormats[0]?.id ?? "",
    lensKind: "prime",
    imageCircleFormatId: data.sensorFormats[0]?.id ?? "",
    adapterType: "mechanical",
    numbers: {},
  };
}

function getProductFormState(
  product: StudioProduct,
  productType: ProductKind,
  data: StudioDashboardData,
  spec: StudioBodySpec | StudioLensSpec | StudioAdapterSpec | null,
): ProductFormState {
  return {
    ...getInitialProductFormState(productType, data),
    productType,
    brandId: product.brandId ?? "",
    systemId: product.systemId ?? "",
    slug: product.slug,
    name: product.name,
    displayName: product.displayName,
    status: product.status,
    mountId: getProductMountId(product.id, productType, data) ?? "",
    bodyStyle: isBodySpec(spec) ? spec.bodyStyle : "mirrorless",
    sensorFormatId: isBodySpec(spec) ? (spec.sensorFormatId ?? "") : "",
    lensKind: isLensSpec(spec) ? spec.lensKind : "prime",
    imageCircleFormatId: isLensSpec(spec)
      ? (spec.imageCircleFormatId ?? "")
      : "",
    adapterType: isAdapterSpec(spec) ? spec.adapterType : "mechanical",
    numbers: getProductNumberState(spec),
  };
}

function serializeProductForm(form: ProductFormState) {
  return {
    productType: form.productType,
    brandId: form.brandId,
    systemId: form.systemId || null,
    slug: form.slug,
    name: form.name,
    displayName: form.displayName,
    status: form.status,
    mountId: form.mountId || null,
    bodyStyle: form.bodyStyle,
    sensorFormatId: form.sensorFormatId || null,
    lensKind: form.lensKind,
    imageCircleFormatId: form.imageCircleFormatId || null,
    adapterType: form.adapterType,
    numbers: form.numbers,
  };
}

function getInitialAssetFormState(
  data: StudioDashboardData,
  products: StudioProduct[],
): AssetFormState {
  const product = products[0] ?? null;

  return {
    productId: product?.id ?? "",
    assetRole: "reference",
    assetView: "front",
    lensHoodState: data.lenses.some((lens) => lens.id === product?.id)
      ? "unknown"
      : "not_applicable",
    storageBucket: "product-assets",
    storagePath: product ? `${product.slug}/front-reference.png` : "",
    sourceName: "",
    sourceUrl: "",
    licenseNotes: "",
    approvalStatus: "needs_review",
    backgroundRemoved: false,
    calibrated: false,
    pixelsPerMm: "",
  };
}

function getAssetFormState(asset: StudioProductAsset): AssetFormState {
  return {
    productId: asset.productId,
    assetRole: asset.assetRole,
    assetView: asset.assetView,
    lensHoodState: asset.lensHoodState,
    storageBucket: asset.storageBucket,
    storagePath: asset.storagePath,
    sourceName: asset.sourceName ?? "",
    sourceUrl: asset.sourceUrl ?? "",
    licenseNotes: asset.licenseNotes ?? "",
    approvalStatus: asset.approvalStatus,
    backgroundRemoved: asset.backgroundRemoved,
    calibrated: asset.calibrated,
    pixelsPerMm: formatOptionalNumber(asset.pixelsPerMm),
  };
}

function serializeAssetForm(form: AssetFormState) {
  return {
    productId: form.productId,
    assetRole: form.assetRole,
    assetView: form.assetView,
    lensHoodState: form.lensHoodState,
    storageBucket: form.storageBucket,
    storagePath: form.storagePath,
    sourceName: form.sourceName,
    sourceUrl: form.sourceUrl,
    licenseNotes: form.licenseNotes,
    approvalStatus: form.approvalStatus,
    backgroundRemoved: form.backgroundRemoved,
    calibrated: form.calibrated,
    pixelsPerMm: form.pixelsPerMm,
  };
}

function updateNumberField(
  setForm: Dispatch<SetStateAction<ProductFormState>>,
  key: string,
  nextValue: string,
) {
  setForm((current) => ({
    ...current,
    numbers: {
      ...current.numbers,
      [key]: nextValue,
    },
  }));
}

function getProductNumberState(
  spec: StudioBodySpec | StudioLensSpec | StudioAdapterSpec | null,
): Record<string, string> {
  if (isBodySpec(spec)) {
    return {
      widthMm: formatOptionalNumber(spec.widthMm),
      heightMm: formatOptionalNumber(spec.heightMm),
      depthMm: formatOptionalNumber(spec.depthMm),
      weightG: formatOptionalNumber(spec.weightG),
    };
  }

  if (isLensSpec(spec)) {
    return {
      focalLengthMinMm: formatOptionalNumber(spec.focalLengthMinMm),
      focalLengthMaxMm: formatOptionalNumber(spec.focalLengthMaxMm),
      maxApertureWide: formatOptionalNumber(spec.maxApertureWide),
      maxApertureTele: formatOptionalNumber(spec.maxApertureTele),
      diameterMm: formatOptionalNumber(spec.diameterMm),
      lengthMm: formatOptionalNumber(spec.lengthMm),
      weightG: formatOptionalNumber(spec.weightG),
      filterThreadMm: formatOptionalNumber(spec.filterThreadMm),
    };
  }

  if (isAdapterSpec(spec)) {
    return {
      addsLengthMm: formatOptionalNumber(spec.addsLengthMm),
      addsWeightG: formatOptionalNumber(spec.addsWeightG),
    };
  }

  return {};
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
    .map((mountId) => formatMountLabel(mountsById.get(mountId) ?? null))
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
    label: `No adapter required${nativeMount ? ` (${formatMountLabel(nativeMount)})` : ""}`,
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

function getProductMountId(
  productId: string,
  productType: ProductKind,
  data: StudioDashboardData,
) {
  if (productType === "camera_body") {
    return data.bodyMounts.find((record) => record.productId === productId)?.mountId;
  }

  if (productType === "lens") {
    return data.lensMounts.find((record) => record.productId === productId)?.mountId;
  }

  return null;
}

function formatProductMount(
  product: StudioProduct,
  productType: ProductKind,
  data: StudioDashboardData,
) {
  if (productType === "adapter") {
    return "Adapter product";
  }

  const mountId = getProductMountId(product.id, productType, data);
  const mount = data.mounts.find((candidate) => candidate.id === mountId) ?? null;

  return `Native mount: ${formatMountLabel(mount)}`;
}

function formatGenericConversion(
  bodyMount: StudioMount | null,
  lensMount: StudioMount | null,
) {
  const lensLabel = formatMountLabel(lensMount);
  const bodyLabel = formatMountLabel(bodyMount);

  return `${lensLabel} -> ${bodyLabel} adapter`;
}

function formatMountLabel(mount: StudioMount | null) {
  return mount?.shortName ?? mount?.name ?? "Unknown mount";
}

function formatProductKind(productType: ProductKind) {
  if (productType === "camera_body") {
    return "Camera Body";
  }

  if (productType === "lens") {
    return "Lens";
  }

  return "Adapter";
}

function isBodySpec(
  spec: StudioBodySpec | StudioLensSpec | StudioAdapterSpec | null,
): spec is StudioBodySpec {
  return Boolean(spec && "bodyStyle" in spec);
}

function isLensSpec(
  spec: StudioBodySpec | StudioLensSpec | StudioAdapterSpec | null,
): spec is StudioLensSpec {
  return Boolean(spec && "lensKind" in spec);
}

function isAdapterSpec(
  spec: StudioBodySpec | StudioLensSpec | StudioAdapterSpec | null,
): spec is StudioAdapterSpec {
  return Boolean(spec && "adapterType" in spec);
}

function formatOptionalNumber(value: number | null) {
  return value == null ? "" : String(value);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildConversionKey(
  conversion: StudioMountConversion,
  linkedAdapterProductIds: string[],
  defaultAdapterProductId: null | string,
) {
  return [
    conversion.id,
    conversion.bodyMountId,
    conversion.lensMountId,
    conversion.preferredDisplayName ?? "",
    conversion.theoreticalExtensionMm ?? "",
    [...linkedAdapterProductIds].sort().join(","),
    defaultAdapterProductId ?? "",
  ].join("|");
}

function buildProductKey(
  product: StudioProduct,
  spec: StudioBodySpec | StudioLensSpec | StudioAdapterSpec | undefined,
  data: StudioDashboardData,
) {
  return [
    product.id,
    product.slug,
    product.name,
    product.displayName,
    product.status,
    product.brandId ?? "",
    product.systemId ?? "",
    getProductMountId(product.id, "camera_body", data) ?? "",
    getProductMountId(product.id, "lens", data) ?? "",
    spec ? JSON.stringify(spec) : "",
  ].join("|");
}

function buildAssetKey(asset: StudioProductAsset) {
  return [
    asset.id,
    asset.productId,
    asset.assetRole,
    asset.assetView,
    asset.lensHoodState,
    asset.storageBucket,
    asset.storagePath,
    asset.approvalStatus,
    asset.backgroundRemoved,
    asset.calibrated,
    asset.pixelsPerMm ?? "",
    asset.sourceName ?? "",
    asset.sourceUrl ?? "",
    asset.licenseNotes ?? "",
  ].join("|");
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel">
      <p className="eyebrow">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-ink">{value}</p>
    </div>
  );
}
