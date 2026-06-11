import { getPrisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { isLowStock } from "@/lib/inventory";
import { formatDate } from "@/lib/utils";
import { InventoryAdjust } from "@/components/admin/inventory-adjust";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const prisma = getPrisma();

  const [variants, recentLogs] = await Promise.all([
    prisma.productVariant.findMany({
      include: { product: { select: { name: true } } },
      orderBy: [{ stock: "asc" }, { sku: "asc" }],
    }),
    prisma.inventoryLog.findMany({
      include: { variant: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Inventory</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manual adjustments require a reason and are recorded in the audit trail.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="table-th">Product / variant</th>
              <th className="table-th">SKU</th>
              <th className="table-th">Price</th>
              <th className="table-th">Stock</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {variants.map((variant) => {
              const low = isLowStock(variant.stock, variant.lowStockThreshold);
              return (
                <tr key={variant.id} className="transition-colors hover:bg-zinc-800/30">
                  <td className="table-td">
                    <p className="font-medium text-white">{variant.product.name}</p>
                    <p className="text-xs text-zinc-500">{variant.name}</p>
                  </td>
                  <td className="table-td font-mono text-xs text-zinc-400">{variant.sku}</td>
                  <td className="table-td">{formatCents(variant.priceCents)}</td>
                  <td className="table-td font-semibold text-white">{variant.stock}</td>
                  <td className="table-td">
                    <span
                      className={cn(
                        "badge",
                        variant.stock === 0
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : low
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                      )}
                    >
                      {variant.stock === 0 ? "Out of stock" : low ? "Low stock" : "Healthy"}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex justify-end">
                      <InventoryAdjust variantId={variant.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {variants.length === 0 && (
              <tr>
                <td className="table-td py-10 text-center text-zinc-500" colSpan={6}>
                  No variants yet — create a product first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="card overflow-hidden">
        <header className="border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Recent inventory activity</h2>
        </header>
        {recentLogs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-500">
            No activity yet. Sales and manual adjustments will be logged here.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800/60">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-200">
                    <span className="font-medium text-white">{log.variant.product.name}</span>{" "}
                    <span className="text-zinc-500">({log.variant.name})</span>
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {log.kind} · {log.reason ?? "no reason recorded"} · {formatDate(log.createdAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-bold",
                    log.delta > 0 ? "text-emerald-300" : "text-red-300",
                  )}
                >
                  {log.delta > 0 ? `+${log.delta}` : log.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
