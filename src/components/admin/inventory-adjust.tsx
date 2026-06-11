"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/** Inline manual stock adjustment with a required reason (audit trail). */
export function InventoryAdjust({ variantId }: { variantId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedDelta = Number(delta);
    if (!Number.isInteger(parsedDelta) || parsedDelta === 0) {
      setError("Delta must be a non-zero integer (e.g. 25 or -3)");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, delta: parsedDelta, reason }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(body?.error?.message ?? "Adjustment failed");
        return;
      }
      setOpen(false);
      setDelta("");
      setReason("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-amber-400/60 hover:text-amber-300"
      >
        Adjust
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="number"
          required
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="+25 / -3"
          aria-label="Stock delta"
          className="input w-24 px-2 py-1.5 text-xs"
        />
        <input
          type="text"
          required
          minLength={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (audit log)"
          aria-label="Adjustment reason"
          className="input w-44 px-2 py-1.5 text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn-primary px-3 py-1.5 text-xs">
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="btn-ghost px-3 py-1.5 text-xs"
        >
          Cancel
        </button>
      </div>
      {error && <p className="max-w-56 text-xs text-red-300">{error}</p>}
    </form>
  );
}
