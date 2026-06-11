import { describe, expect, it } from "vitest";
import {
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  cartSubtotalCents,
  cartTotals,
  discountAmountCents,
  formatCents,
  lineTotalCents,
  shippingCents,
} from "@/lib/money";

describe("line and subtotal math (integer cents)", () => {
  it("multiplies unit price by quantity exactly", () => {
    expect(lineTotalCents({ unitPriceCents: 3299, quantity: 3 })).toBe(9897);
  });

  it("sums an empty cart to zero", () => {
    expect(cartSubtotalCents([])).toBe(0);
  });

  it("sums mixed lines without floating-point drift", () => {
    // 0.1 + 0.2 style drift is impossible with integers: 1010 + 2020 === 3030.
    const lines = [
      { unitPriceCents: 1010, quantity: 1 },
      { unitPriceCents: 1010, quantity: 2 },
    ];
    expect(cartSubtotalCents(lines)).toBe(3030);
  });

  it("rejects non-integer prices — money must never be a float", () => {
    expect(() => lineTotalCents({ unitPriceCents: 19.99, quantity: 1 })).toThrow(/integer/);
  });

  it("rejects negative prices and zero/negative quantities", () => {
    expect(() => lineTotalCents({ unitPriceCents: -100, quantity: 1 })).toThrow();
    expect(() => lineTotalCents({ unitPriceCents: 100, quantity: 0 })).toThrow();
    expect(() => lineTotalCents({ unitPriceCents: 100, quantity: 1.5 })).toThrow();
  });
});

describe("discount math", () => {
  it("applies percent discounts with banker-free deterministic rounding", () => {
    expect(discountAmountCents(10_000, { type: "PERCENT", value: 10 })).toBe(1_000);
    expect(discountAmountCents(999, { type: "PERCENT", value: 10 })).toBe(100); // 99.9 -> 100
  });

  it("clamps fixed discounts to the subtotal", () => {
    expect(discountAmountCents(500, { type: "FIXED", value: 2_000 })).toBe(500);
  });

  it("returns zero when no discount is given", () => {
    expect(discountAmountCents(5_000)).toBe(0);
  });

  it("rejects percents above 100 and negative values", () => {
    expect(() => discountAmountCents(1_000, { type: "PERCENT", value: 101 })).toThrow();
    expect(() => discountAmountCents(1_000, { type: "FIXED", value: -1 })).toThrow();
  });
});

describe("shipping rules", () => {
  it("ships free at or above the threshold", () => {
    expect(shippingCents(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0);
    expect(shippingCents(FREE_SHIPPING_THRESHOLD_CENTS + 1)).toBe(0);
  });

  it("charges the flat rate below the threshold", () => {
    expect(shippingCents(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(FLAT_SHIPPING_CENTS);
  });

  it("charges nothing for an empty cart", () => {
    expect(shippingCents(0)).toBe(0);
  });
});

describe("cartTotals end to end", () => {
  it("combines subtotal, discount and shipping", () => {
    const lines = [
      { unitPriceCents: 3_200, quantity: 1 },
      { unitPriceCents: 2_200, quantity: 2 },
    ]; // subtotal 7600 — free shipping on its own
    const totals = cartTotals(lines, { type: "PERCENT", value: 10 });

    expect(totals.subtotalCents).toBe(7_600);
    expect(totals.discountCents).toBe(760);
    // After discount the order drops below the free-shipping threshold.
    expect(totals.shippingCents).toBe(FLAT_SHIPPING_CENTS);
    expect(totals.totalCents).toBe(7_600 - 760 + FLAT_SHIPPING_CENTS);
  });

  it("never produces a negative total even with a 100% discount", () => {
    const totals = cartTotals([{ unitPriceCents: 4_999, quantity: 1 }], {
      type: "PERCENT",
      value: 100,
    });
    expect(totals.totalCents).toBe(0);
    expect(totals.shippingCents).toBe(0);
  });
});

describe("formatCents", () => {
  it("formats cents as currency", () => {
    expect(formatCents(3299)).toBe("$32.99");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(100_000)).toBe("$1,000.00");
  });
});
