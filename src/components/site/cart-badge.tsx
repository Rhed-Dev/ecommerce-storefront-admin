"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/** Custom event dispatched by add-to-cart / cart mutations so the badge stays live. */
export const CART_UPDATED_EVENT = "cart:updated";

export function notifyCartUpdated(): void {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { itemCount?: number };
      setCount(data.itemCount ?? 0);
    } catch {
      // Network/DB hiccup: keep whatever we had instead of crashing the nav.
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CART_UPDATED_EVENT, refresh);
  }, [refresh]);

  return (
    <Link
      href="/cart"
      aria-label="Cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-white"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.636a1.5 1.5 0 0 1 1.46 1.155L5.7 5.7m0 0 1.578 6.97A2.25 2.25 0 0 0 9.473 14.4h7.682a2.25 2.25 0 0 0 2.18-1.704l1.415-5.661A.75.75 0 0 0 20.02 6.1H5.7Zm2.55 12.15a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Zm9 0a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Z"
        />
      </svg>
      {count !== null && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-zinc-950">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
