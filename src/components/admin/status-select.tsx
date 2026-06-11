"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatusValue } from "@/lib/orders";
import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Inline order-status control. Only the transitions allowed by the status
 * state machine are offered; the API enforces the same rules server-side.
 */
export function StatusSelect({
  orderId,
  current,
  allowed,
}: {
  orderId: string;
  current: OrderStatusValue;
  allowed: readonly OrderStatusValue[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: OrderStatusValue) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(body?.error?.message ?? "Update failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("badge", orderStatusBadgeClass(current))}>
          {orderStatusLabel(current)}
        </span>
        {allowed.map((status) => (
          <button
            key={status}
            type="button"
            disabled={pending}
            onClick={() => void updateStatus(status)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-amber-400/60 hover:text-amber-300 disabled:opacity-50"
          >
            → {orderStatusLabel(status)}
          </button>
        ))}
        {allowed.length === 0 && <span className="text-xs text-zinc-600">terminal</span>}
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
