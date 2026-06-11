"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifyCartUpdated } from "@/components/site/cart-badge";

export function CartLineControls({
  itemId,
  quantity,
  maxQuantity,
}: {
  itemId: string;
  quantity: number;
  maxQuantity: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(newQuantity: number) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(body?.error?.message ?? "Update failed");
        return;
      }
      notifyCartUpdated();
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-900">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={pending}
            onClick={() => void update(quantity - 1)}
            className="px-3 py-1.5 text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
          >
            −
          </button>
          <span className="min-w-7 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={pending || quantity >= maxQuantity}
            onClick={() => void update(quantity + 1)}
            className="px-3 py-1.5 text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
          >
            +
          </button>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => void update(0)}
          className="text-sm text-zinc-500 underline-offset-2 transition-colors hover:text-red-300 hover:underline disabled:opacity-50"
        >
          Remove
        </button>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
