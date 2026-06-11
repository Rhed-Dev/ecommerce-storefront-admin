import type { Metadata } from "next";
import Link from "next/link";
import { safeQuery } from "@/lib/db";
import { getCartWithItems } from "@/lib/cart";
import { cartTotals, formatCents, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/money";
import { CartLineControls } from "@/components/cart/cart-line-controls";
import { CheckoutButton } from "@/components/cart/checkout-button";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const cart = await safeQuery(getCartWithItems, null);
  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-site px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-3xl font-bold text-white">Your cart</h1>
        <EmptyState
          icon={<span aria-hidden="true">🛒</span>}
          title="Your cart is empty"
          description="Browse the collection and add something worth keeping."
          actionHref="/products"
          actionLabel="Start shopping"
        />
      </div>
    );
  }

  const totals = cartTotals(
    items.map((item) => ({ unitPriceCents: item.variant.priceCents, quantity: item.quantity })),
  );
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD_CENTS - totals.subtotalCents;

  return (
    <div className="mx-auto max-w-site px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-white">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="card divide-y divide-zinc-800/80">
          {items.map((item) => {
            const image = item.variant.product.images[0];
            return (
              <div key={item.id} className="flex gap-4 p-4 sm:p-5">
                <Link
                  href={`/products/${item.variant.product.slug}`}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800"
                >
                  {image ? (
                    <img
                      src={image.url}
                      alt={image.alt ?? item.variant.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-zinc-600">
                      {item.variant.product.name.charAt(0)}
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <Link
                      href={`/products/${item.variant.product.slug}`}
                      className="text-sm font-semibold text-white hover:text-amber-300"
                    >
                      {item.variant.product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.variant.name}</p>
                    <p className="mt-1 text-sm font-medium text-amber-300">
                      {formatCents(item.variant.priceCents)}
                    </p>
                  </div>
                  <CartLineControls
                    itemId={item.id}
                    quantity={item.quantity}
                    maxQuantity={item.variant.stock}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <aside className="card h-fit p-6">
          <h2 className="text-base font-semibold text-white">Order summary</h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-400">Subtotal</dt>
              <dd className="font-medium text-white">{formatCents(totals.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Shipping</dt>
              <dd className="font-medium text-white">
                {totals.shippingCents === 0 ? "Free" : formatCents(totals.shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-3 text-base">
              <dt className="font-semibold text-white">Total</dt>
              <dd className="font-bold text-amber-300">{formatCents(totals.totalCents)}</dd>
            </div>
          </dl>

          {remainingForFreeShipping > 0 && (
            <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
              Add {formatCents(remainingForFreeShipping)} more for free shipping.
            </p>
          )}

          <div className="mt-6">
            <CheckoutButton />
          </div>
        </aside>
      </div>
    </div>
  );
}
