import { getPrisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { nextStatuses } from "@/lib/orders";
import { StatusSelect } from "@/components/admin/status-select";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getPrisma().order.findMany({
    include: { items: true, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {orders.length} total · status changes follow the fulfilment state machine
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders are created by the Stripe webhook when a checkout completes. Run a test checkout to see one land here."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[840px]">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="table-th">Order</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Items</th>
                <th className="table-th">Total</th>
                <th className="table-th">Placed</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {orders.map((order) => (
                <tr key={order.id} className="align-top transition-colors hover:bg-zinc-800/30">
                  <td className="table-td font-semibold text-white">#{order.number}</td>
                  <td className="table-td">
                    <p className="text-zinc-200">{order.user?.name ?? "Guest"}</p>
                    <p className="text-xs text-zinc-500">{order.email}</p>
                  </td>
                  <td className="table-td">
                    <ul className="space-y-0.5 text-xs text-zinc-400">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity} × {item.productName}{" "}
                          <span className="text-zinc-600">({item.variantName})</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="table-td font-semibold text-amber-300">
                    {formatCents(order.totalCents)}
                  </td>
                  <td className="table-td text-zinc-400">{formatDate(order.createdAt)}</td>
                  <td className="table-td">
                    <StatusSelect
                      orderId={order.id}
                      current={order.status}
                      allowed={nextStatuses(order.status)}
                    />
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
