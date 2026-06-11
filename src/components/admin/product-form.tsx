"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { slugify } from "@/lib/utils";

export interface VariantDraft {
  id?: string;
  name: string;
  sku: string;
  priceDollars: string; // edited as dollars, submitted as integer cents
  stock: string;
  lowStockThreshold: string;
}

export interface ImageDraft {
  publicId: string;
  url: string;
  alt: string;
}

export interface ProductFormInitial {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  featured: boolean;
  variants: VariantDraft[];
  images: ImageDraft[];
}

const EMPTY_VARIANT: VariantDraft = {
  name: "",
  sku: "",
  priceDollars: "",
  stock: "0",
  lowStockThreshold: "5",
};

interface SignResponse {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export function ProductForm({
  initial,
  categories,
  cloudinaryConfigured,
}: {
  initial: ProductFormInitial;
  categories: Array<{ id: string; name: string }>;
  cloudinaryConfigured: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);

  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [manualUrl, setManualUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof ProductFormInitial>(key: K, value: ProductFormInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setVariant(index: number, patch: Partial<VariantDraft>) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  /** Signed direct-to-Cloudinary upload: signature comes from our server, file goes to Cloudinary. */
  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "storefront/products" }),
      });
      if (!signRes.ok) {
        const body = (await signRes.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(body?.error?.message ?? "Could not sign upload");
      }
      const sign = (await signRes.json()) as SignResponse;

      const data = new FormData();
      data.append("file", file);
      data.append("api_key", sign.apiKey);
      data.append("timestamp", String(sign.timestamp));
      data.append("folder", sign.folder);
      data.append("signature", sign.signature);

      const uploadRes = await fetch(sign.uploadUrl, { method: "POST", body: data });
      if (!uploadRes.ok) throw new Error("Cloudinary rejected the upload");
      const uploaded = (await uploadRes.json()) as { public_id: string; secure_url: string };

      setField("images", [
        ...form.images,
        { publicId: uploaded.public_id, url: uploaded.secure_url, alt: form.name },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function addManualUrl() {
    const url = manualUrl.trim();
    if (!url) return;
    setField("images", [...form.images, { publicId: `external/${slugify(form.name) || "image"}-${form.images.length + 1}`, url, alt: form.name }]);
    setManualUrl("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      categoryId: form.categoryId,
      featured: form.featured,
      variants: form.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        name: v.name,
        sku: v.sku,
        priceCents: Math.round(Number(v.priceDollars) * 100),
        stock: Number(v.stock),
        lowStockThreshold: Number(v.lowStockThreshold),
      })),
      images: form.images.map((img) => ({
        publicId: img.publicId,
        url: img.url,
        ...(img.alt ? { alt: img.alt } : {}),
      })),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/products/${initial.id}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string; details?: Record<string, string[]> };
        } | null;
        const detail = body?.error?.details ? Object.values(body.error.details).flat()[0] : undefined;
        setError(detail ?? body?.error?.message ?? "Save failed");
        setPending(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error");
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <div>
          <label htmlFor="product-name" className="label">Name</label>
          <input
            id="product-name"
            required
            value={form.name}
            onChange={(e) => {
              setField("name", e.target.value);
              if (!slugTouched) setField("slug", slugify(e.target.value));
            }}
            className="input"
            placeholder="Heavyweight Crew Tee"
          />
        </div>
        <div>
          <label htmlFor="product-slug" className="label">Slug</label>
          <input
            id="product-slug"
            required
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setField("slug", e.target.value);
            }}
            className="input"
            placeholder="heavyweight-crew-tee"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="product-description" className="label">Description</label>
          <textarea
            id="product-description"
            required
            rows={4}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            className="input resize-y"
            placeholder="Tell shoppers what makes it good (min 10 characters)…"
          />
        </div>
        <div>
          <label htmlFor="product-category" className="label">Category</label>
          <select
            id="product-category"
            required
            value={form.categoryId}
            onChange={(e) => setField("categoryId", e.target.value)}
            className="input"
          >
            <option value="" disabled>Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <label className="mt-6 flex items-center gap-2.5 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setField("featured", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-amber-400"
          />
          Feature on the home page
        </label>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Variants</h2>
          <button
            type="button"
            onClick={() => setField("variants", [...form.variants, { ...EMPTY_VARIANT }])}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            + Add variant
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {form.variants.map((variant, index) => (
            <div key={variant.id ?? `new-${index}`} className="grid gap-2 rounded-lg border border-zinc-800 p-3 sm:grid-cols-[1fr_1fr_110px_90px_90px_auto]">
              <input
                required
                value={variant.name}
                onChange={(e) => setVariant(index, { name: e.target.value })}
                className="input px-2.5 py-1.5 text-xs"
                placeholder="Option (e.g. M / Black)"
                aria-label="Variant name"
              />
              <input
                required
                value={variant.sku}
                onChange={(e) => setVariant(index, { sku: e.target.value.toUpperCase() })}
                className="input px-2.5 py-1.5 text-xs"
                placeholder="SKU"
                aria-label="SKU"
              />
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={variant.priceDollars}
                onChange={(e) => setVariant(index, { priceDollars: e.target.value })}
                className="input px-2.5 py-1.5 text-xs"
                placeholder="Price $"
                aria-label="Price in dollars"
              />
              <input
                required
                type="number"
                min="0"
                step="1"
                value={variant.stock}
                onChange={(e) => setVariant(index, { stock: e.target.value })}
                className="input px-2.5 py-1.5 text-xs"
                placeholder="Stock"
                aria-label="Stock"
              />
              <input
                required
                type="number"
                min="0"
                step="1"
                value={variant.lowStockThreshold}
                onChange={(e) => setVariant(index, { lowStockThreshold: e.target.value })}
                className="input px-2.5 py-1.5 text-xs"
                placeholder="Low-stock at"
                aria-label="Low stock threshold"
              />
              <button
                type="button"
                disabled={form.variants.length === 1}
                onClick={() => setField("variants", form.variants.filter((_, i) => i !== index))}
                className="btn-danger px-2.5 py-1.5 text-xs"
                aria-label="Remove variant"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Images</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {form.images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-800">
              <img src={image.url} alt={image.alt || form.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setField("images", form.images.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-zinc-950/90 text-xs text-red-300 group-hover:flex"
                aria-label={`Remove image ${index + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
          {form.images.length === 0 && (
            <p className="text-sm text-zinc-500">No images yet — upload or paste a URL below.</p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label
            className={
              cloudinaryConfigured
                ? "btn-secondary cursor-pointer"
                : "btn-secondary cursor-not-allowed opacity-50"
            }
          >
            {uploading ? "Uploading…" : "Upload to Cloudinary"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={!cloudinaryConfigured || uploading}
              onChange={(e) => void uploadFile(e)}
            />
          </label>
          {!cloudinaryConfigured && (
            <span className="text-xs text-zinc-500">
              Set the CLOUDINARY_* env vars to enable signed uploads.
            </span>
          )}
          <div className="flex flex-1 gap-2">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="input"
              placeholder="…or paste an image URL"
              aria-label="Image URL"
            />
            <button type="button" onClick={addManualUrl} className="btn-secondary">
              Add
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary px-6 py-3">
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
