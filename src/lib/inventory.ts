/**
 * Pure inventory logic shared by the checkout pre-check, the Stripe webhook
 * and the admin manual-adjustment endpoint. The actual database decrement is
 * a conditional UPDATE inside a transaction (see the webhook route); this
 * module encodes the decision rules so they can be unit-tested without a DB.
 */

export interface StockRequest {
  variantId: string;
  quantity: number;
}

export interface Shortage {
  variantId: string;
  requested: number;
  available: number;
}

export type StockPlan =
  | { ok: true; decrements: StockRequest[] }
  | { ok: false; shortages: Shortage[] };

/**
 * Plan stock decrements for a set of requested lines against current levels.
 * Duplicate requests for the same variant are merged first — two cart lines
 * for the same variant must not each pass the check independently.
 */
export function planStockDecrements(
  requests: readonly StockRequest[],
  levels: ReadonlyMap<string, number>,
): StockPlan {
  const merged = new Map<string, number>();
  for (const request of requests) {
    if (!Number.isInteger(request.quantity) || request.quantity < 1) {
      throw new Error(`quantity must be a positive integer, got ${request.quantity}`);
    }
    merged.set(request.variantId, (merged.get(request.variantId) ?? 0) + request.quantity);
  }

  const shortages: Shortage[] = [];
  const decrements: StockRequest[] = [];
  for (const [variantId, quantity] of merged) {
    const available = levels.get(variantId) ?? 0;
    if (quantity > available) {
      shortages.push({ variantId, requested: quantity, available });
    } else {
      decrements.push({ variantId, quantity });
    }
  }

  return shortages.length > 0 ? { ok: false, shortages } : { ok: true, decrements };
}

/** A variant is "low stock" when at or below its configured threshold. */
export function isLowStock(stock: number, threshold: number): boolean {
  return stock <= threshold;
}

/** Manual adjustments may add or remove stock but may never go negative. */
export function canAdjustStock(currentStock: number, delta: number): boolean {
  if (!Number.isInteger(delta) || delta === 0) return false;
  return currentStock + delta >= 0;
}
