/**
 * Money math. Every amount in the system is an integer number of cents.
 *
 * Floating-point arithmetic cannot represent most decimal fractions exactly
 * (0.1 + 0.2 !== 0.3), and rounding drift across subtotals, discounts and
 * webhooks is how stores end up disagreeing with their payment processor.
 * Integers are exact, comparable, and match Stripe's `unit_amount` contract.
 */

export interface CartLine {
  unitPriceCents: number;
  quantity: number;
}

export type Discount =
  | { type: "PERCENT"; value: number } // value = whole percent, e.g. 10 => 10%
  | { type: "FIXED"; value: number }; // value = cents

export interface CartTotals {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}

/** Orders at or above this subtotal (after discount) ship free. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7_500;

/** Flat shipping rate below the free-shipping threshold. */
export const FLAT_SHIPPING_CENTS = 599;

/** Throws unless `value` is a non-negative integer — the only legal money shape. */
export function assertCents(value: number, label = "amount"): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer number of cents, got ${value}`);
  }
}

export function lineTotalCents(line: CartLine): number {
  assertCents(line.unitPriceCents, "unitPriceCents");
  if (!Number.isInteger(line.quantity) || line.quantity < 1) {
    throw new Error(`quantity must be a positive integer, got ${line.quantity}`);
  }
  return line.unitPriceCents * line.quantity;
}

export function cartSubtotalCents(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotalCents(line), 0);
}

/** Discount amount in cents, clamped so it can never exceed the subtotal. */
export function discountAmountCents(subtotalCents: number, discount?: Discount): number {
  assertCents(subtotalCents, "subtotalCents");
  if (!discount) return 0;
  if (discount.value < 0) throw new Error("discount value must not be negative");

  if (discount.type === "PERCENT") {
    if (discount.value > 100) throw new Error("percent discount cannot exceed 100");
    return Math.round((subtotalCents * discount.value) / 100);
  }
  assertCents(discount.value, "fixed discount");
  return Math.min(discount.value, subtotalCents);
}

export function shippingCents(subtotalAfterDiscountCents: number): number {
  assertCents(subtotalAfterDiscountCents, "subtotal");
  if (subtotalAfterDiscountCents === 0) return 0;
  return subtotalAfterDiscountCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}

export function cartTotals(lines: readonly CartLine[], discount?: Discount): CartTotals {
  const subtotal = cartSubtotalCents(lines);
  const discountAmount = discountAmountCents(subtotal, discount);
  const discounted = subtotal - discountAmount;
  const shipping = shippingCents(discounted);
  return {
    subtotalCents: subtotal,
    discountCents: discountAmount,
    shippingCents: shipping,
    totalCents: discounted + shipping,
  };
}

/** Format integer cents for display, e.g. 3299 -> "$32.99". */
export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
