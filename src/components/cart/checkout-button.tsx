"use client";

import { useState } from "react";

export function CheckoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
        error?: { message?: string };
      } | null;

      if (res.ok && body?.url) {
        window.location.href = body.url;
        return;
      }
      setError(body?.error?.message ?? "Checkout could not be started");
    } catch {
      setError("Network error — please try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={pending}
        className="btn-primary w-full py-3"
      >
        {pending ? "Redirecting to Stripe…" : "Checkout with Stripe"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <p className="text-center text-xs text-zinc-500">
        Test mode — use card 4242 4242 4242 4242, any future date, any CVC.
      </p>
    </div>
  );
}
