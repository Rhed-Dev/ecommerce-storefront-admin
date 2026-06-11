import { ORDER_FLOW, flowIndex, type OrderStatusValue } from "@/lib/orders";
import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Visual status timeline for an order. Happy-path statuses render as steps;
 * CANCELLED / REFUNDED orders show a terminal badge instead.
 */
export function OrderTimeline({ status }: { status: OrderStatusValue }) {
  const currentIndex = flowIndex(status);

  if (currentIndex === -1) {
    return (
      <div className="flex items-center gap-2">
        <span className={cn("badge", orderStatusBadgeClass(status))}>
          {orderStatusLabel(status)}
        </span>
        <span className="text-xs text-zinc-500">
          {status === "CANCELLED" ? "This order was cancelled." : "This order was refunded."}
        </span>
      </div>
    );
  }

  return (
    <ol className="flex items-center gap-0" aria-label="Order progress">
      {ORDER_FLOW.map((step, index) => {
        const reached = index <= currentIndex;
        const isLast = index === ORDER_FLOW.length - 1;
        return (
          <li key={step} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold",
                  reached
                    ? "border-amber-400 bg-amber-400 text-zinc-950"
                    : "border-zinc-700 bg-zinc-900 text-zinc-500",
                )}
                aria-hidden="true"
              >
                {reached ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide",
                  reached ? "text-amber-300" : "text-zinc-500",
                )}
              >
                {orderStatusLabel(step)}
              </span>
            </div>
            {!isLast && (
              <div
                aria-hidden="true"
                className={cn(
                  "mx-2 mb-5 h-px flex-1",
                  index < currentIndex ? "bg-amber-400" : "bg-zinc-800",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
