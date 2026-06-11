import type { Metadata } from "next";
import Link from "next/link";
import { safeQuery, getPrisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { OrderTimeline } from "@/components/account/order-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order confirmed" };

type SearchParams = Promise<{ session_id?: string }>;

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { session_id: sessionId } = await searchParams;

  // The webhook creates the order; if it hasn't landed yet we show a
  // "finalizing" state rather than blocking on Stripe.
  const order = sessionId
    ? await safeQuery(
        () =>
          getPrisma().order.findUnique({
            where: { stripeSessionId: sessionId },
            include: { items: true },
          }),
        null,
      )
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="card p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-300">
          ✓
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">Thank you — payment received</h1>

        {order ? (
          <>
            <p className="mt-2 text-sm text-zinc-400">
              Order <span className="font-semibold text-white">#{order.number}</span> is confirmed.
              A receipt was sent to {order.email}.
            </p>

            <div className="mt-8 text-left">
              <OrderTimeline status={order.status} />
            </div>

            <div className="mt-8 divide-y divide-zinc-800 rounded-lg border border-zinc-800 text-left">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-white">{item.productName}</p>
                    <p className="text-xs text-zinc-500">
                      {item.variantName} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-zinc-300">
                    {formatCents(item.unitPriceCents * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <p className="font-semibold text-white">Total</p>
                <p className="font-bold text-amber-300">{formatCents(order.totalCents)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Your payment went through and your order is being finalized — Stripe is delivering the
            confirmation webhook. Refresh in a moment, or find it under your order history.
          </p>
        )}

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/account/orders" className="btn-primary">
            View order history
          </Link>
          <Link href="/products" className="btn-secondary">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
