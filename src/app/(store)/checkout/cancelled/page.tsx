import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Checkout cancelled" };

export default function CheckoutCancelledPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="card p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-500/15 text-2xl text-zinc-300">
          ↩
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">Checkout cancelled</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          No charge was made and your cart is exactly as you left it. Take your time.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/cart" className="btn-primary">
            Back to cart
          </Link>
          <Link href="/products" className="btn-secondary">
            Keep browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
