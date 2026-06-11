import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/ui";
import { StatCard } from "@/components/admin/stat-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REVENUE_STATUSES = ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"] as const;

export default async function AdminDashboardPage() {
  const prisma = getPrisma();

  const [revenue, orderCount, customerCount, variants, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { in: [...REVENUE_STATUSES] } },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.productVariant.findMany({
      include: { product: { select: { name: true, id: true } } },
      orderBy: { stock: "asc" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: { select: { quantity: true } } },
    }),
  ]);

  const lowStock = variants.filter((v) => v.stock <= v.lowStockThreshold);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Store health at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (paid orders)"
          value={formatCents(revenue._sum.totalCents ?? 0)}
          hint="PAID, FULFILLED, SHIPPED and DELIVERED orders"
        />
        <StatCard label="Orders" value={String(orderCount)} hint="All statuses" />
        <StatCard label="Customers" value={String(customerCount)} hint="Registered accounts" />
        <StatCard
          label="Low-stock variants"
          value={String(lowStock.length)}
          hint="At or below their threshold"
          tone={lowStock.length > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Low stock alerts */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">Low-stock alerts</h2>
            <Link href="/admin/inventory" className="text-xs font-semibold text-amber-300 hover:text-amber-200">
              Open inventory →
            </Link>
          </header>
          {lowStock.length === 0 ? (
            <p className="px-5 py-8 text-sm text-zinc-500">
              All variants are above their low-stock thresholds. Nothing to restock.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {lowStock.slice(0, 6).map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {variant.product.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {variant.name} · {variant.sku}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "badge shrink-0",
                      variant.stock === 0
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300",
                    )}
                  >
                    {variant.stock === 0 ? "Out of stock" : `${variant.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent orders */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-amber-300 hover:text-amber-200">
              All orders →
            </Link>
          </header>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-sm text-zinc-500">
              No orders yet — they will appear here as soon as a checkout completes.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">#{order.number}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {order.email} · {formatDate(order.createdAt)} ·{" "}
                      {order.items.reduce((n, item) => n + item.quantity, 0)} items
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={cn("badge", orderStatusBadgeClass(order.status))}>
                      {orderStatusLabel(order.status)}
                    </span>
                    <span className="text-sm font-semibold text-zinc-200">
                      {formatCents(order.totalCents)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
