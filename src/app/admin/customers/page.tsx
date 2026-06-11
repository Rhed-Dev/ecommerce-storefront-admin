import { getPrisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const prisma = getPrisma();

  const [customers, spendByUser] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["userId"],
      _sum: { totalCents: true },
      where: { status: { in: ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"] } },
    }),
  ]);

  const spendMap = new Map(
    spendByUser
      .filter((row) => row.userId !== null)
      .map((row) => [row.userId as string, row._sum.totalCents ?? 0]),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="mt-1 text-sm text-zinc-400">{customers.length} registered accounts</p>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Accounts appear here when shoppers register or sign in with Google."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="table-th">Customer</th>
                <th className="table-th">Email</th>
                <th className="table-th">Joined</th>
                <th className="table-th">Orders</th>
                <th className="table-th">Lifetime spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {customers.map((customer) => (
                <tr key={customer.id} className="transition-colors hover:bg-zinc-800/30">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-sm font-bold text-amber-300">
                        {(customer.name ?? customer.email).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{customer.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="table-td text-zinc-400">{customer.email}</td>
                  <td className="table-td text-zinc-400">{formatDate(customer.createdAt)}</td>
                  <td className="table-td">{customer._count.orders}</td>
                  <td className="table-td font-semibold text-amber-300">
                    {formatCents(spendMap.get(customer.id) ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
