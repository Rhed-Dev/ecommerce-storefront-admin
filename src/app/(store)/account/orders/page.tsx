import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPrisma, safeQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/guard";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { OrderTimeline } from "@/components/account/order-timeline";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order history" };

export default async function AccountOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/account/orders");

  const orders = await safeQuery(
    () =>
      getPrisma().order.findMany({
        where: {
          OR: [{ userId: user.id }, ...(user.email ? [{ email: user.email }] : [])],
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
    [],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-white">Order history</h1>
      <p className="mt-1.5 text-sm text-zinc-400">
        Signed in as {user.email ?? user.name ?? "customer"}
      </p>

      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<span aria-hidden="true">📦</span>}
            title="No orders yet"
            description="When you place an order it will show up here with a live status timeline."
            actionHref="/products"
            actionLabel="Shop the collection"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <article key={order.id} className="card overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Order #{order.number}</h2>
                  <p className="text-xs text-zinc-500">Placed {formatDate(order.createdAt)}</p>
                </div>
                <p className="text-sm font-bold text-amber-300">{formatCents(order.totalCents)}</p>
              </header>

              <div className="px-5 py-5">
                <OrderTimeline status={order.status} />
              </div>

              <div className="divide-y divide-zinc-800/60 border-t border-zinc-800">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-white">{item.productName}</p>
                      <p className="text-xs text-zinc-500">
                        {item.variantName} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-zinc-300">{formatCents(item.unitPriceCents * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
