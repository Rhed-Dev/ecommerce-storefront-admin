/**
 * Order status state machine.
 *
 * Statuses move strictly forward through the fulfilment pipeline; CANCELLED
 * and REFUNDED are terminal exits. Both the admin status endpoint and the
 * customer-facing timeline derive from this single source of truth.
 */

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/** The happy-path fulfilment pipeline, in order. */
export const ORDER_FLOW: readonly OrderStatusValue[] = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
];

const ALLOWED_TRANSITIONS: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["FULFILLED", "CANCELLED", "REFUNDED"],
  FULFILLED: ["SHIPPED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function isOrderStatus(value: string): value is OrderStatusValue {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: OrderStatusValue, to: OrderStatusValue): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: OrderStatusValue): readonly OrderStatusValue[] {
  return ALLOWED_TRANSITIONS[from];
}

export function assertTransition(from: OrderStatusValue, to: OrderStatusValue): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid order status transition ${from} -> ${to}. Allowed: ${
        ALLOWED_TRANSITIONS[from].join(", ") || "(none — terminal status)"
      }`,
    );
  }
}

/** Index of a status within the happy path, or -1 for CANCELLED/REFUNDED. */
export function flowIndex(status: OrderStatusValue): number {
  return ORDER_FLOW.indexOf(status);
}
