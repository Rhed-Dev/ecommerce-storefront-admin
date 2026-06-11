"use client";

import { useMemo, useState } from "react";
import { formatCents } from "@/lib/money";
import { notifyCartUpdated } from "@/components/site/cart-badge";
import { cn } from "@/lib/utils";

export interface PurchasableVariant {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
}

type Feedback = { kind: "success" | "error"; message: string } | null;

export function AddToCart({ variants }: { variants: PurchasableVariant[] }) {
  const firstAvailable = useMemo(
    () => variants.find((v) => v.stock > 0) ?? variants[0],
    [variants],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(firstAvailable?.id);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const selected = variants.find((v) => v.id === selectedId);

  async function addToCart() {
    if (!selected) return;
    setPending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.id, quantity }),
      });
      if (res.ok) {
        notifyCartUpdated();
        setFeedback({ kind: "success", message: "Added to cart" });
      } else {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setFeedback({
          kind: "error",
          message: body?.error?.message ?? "Could not add to cart",
        });
      }
    } catch {
      setFeedback({ kind: "error", message: "Network error — is the server running?" });
    } finally {
      setPending(false);
    }
  }

  if (variants.length === 0) {
    return <p className="text-sm text-zinc-400">This product is not currently available.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="label">Option</p>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => {
                setSelectedId(variant.id);
                setQuantity(1);
                setFeedback(null);
              }}
              disabled={variant.stock === 0}
              className={cn(
                "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                variant.id === selectedId
                  ? "border-amber-400 bg-amber-400/10 text-amber-300"
                  : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500",
                variant.stock === 0 && "cursor-not-allowed opacity-40 line-through",
              )}
            >
              {variant.name}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-white">{formatCents(selected.priceCents)}</span>
          {selected.stock > 0 && selected.stock <= 5 ? (
            <span className="text-sm font-medium text-amber-300">
              Only {selected.stock} left
            </span>
          ) : selected.stock === 0 ? (
            <span className="text-sm font-medium text-red-300">Out of stock</span>
          ) : (
            <span className="text-sm text-emerald-300">In stock</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-900">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3.5 py-2.5 text-zinc-300 transition-colors hover:text-white"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(selected?.stock ?? 1, q + 1))}
            className="px-3.5 py-2.5 text-zinc-300 transition-colors hover:text-white"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => void addToCart()}
          disabled={pending || !selected || selected.stock === 0}
          className="btn-primary flex-1 py-3"
        >
          {pending ? "Adding…" : "Add to cart"}
        </button>
      </div>

      {feedback && (
        <p
          role="status"
          className={cn(
            "text-sm font-medium",
            feedback.kind === "success" ? "text-emerald-300" : "text-red-300",
          )}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
