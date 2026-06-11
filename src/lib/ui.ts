import type { OrderStatusValue } from "@/lib/orders";

/** Badge styling per order status — full literal class strings so Tailwind JIT picks them up. */
const STATUS_BADGE_CLASSES: Record<OrderStatusValue, string> = {
  PENDING: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
  PAID: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  FULFILLED: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  SHIPPED: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  DELIVERED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-red-500/10 text-red-300 border-red-500/30",
  REFUNDED: "bg-orange-500/10 text-orange-300 border-orange-500/30",
};

export function orderStatusBadgeClass(status: OrderStatusValue): string {
  return STATUS_BADGE_CLASSES[status];
}

export function orderStatusLabel(status: OrderStatusValue): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
