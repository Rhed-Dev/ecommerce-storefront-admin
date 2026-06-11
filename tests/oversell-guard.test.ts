import { describe, expect, it } from "vitest";
import { canAdjustStock, isLowStock, planStockDecrements } from "@/lib/inventory";

describe("planStockDecrements (oversell guard)", () => {
  const levels = new Map([
    ["variant-tee-m", 5],
    ["variant-mug", 2],
    ["variant-tote", 0],
  ]);

  it("approves a plan when every requested quantity is available", () => {
    const plan = planStockDecrements(
      [
        { variantId: "variant-tee-m", quantity: 3 },
        { variantId: "variant-mug", quantity: 2 },
      ],
      levels,
    );
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.decrements).toContainEqual({ variantId: "variant-tee-m", quantity: 3 });
      expect(plan.decrements).toContainEqual({ variantId: "variant-mug", quantity: 2 });
    }
  });

  it("rejects when a single line exceeds available stock", () => {
    const plan = planStockDecrements([{ variantId: "variant-mug", quantity: 3 }], levels);
    expect(plan.ok).toBe(false);
    if (!plan.ok) {
      expect(plan.shortages).toEqual([
        { variantId: "variant-mug", requested: 3, available: 2 },
      ]);
    }
  });

  it("merges duplicate lines before checking — they must not pass independently", () => {
    // 3 + 3 = 6 requested against 5 in stock: each line alone would pass.
    const plan = planStockDecrements(
      [
        { variantId: "variant-tee-m", quantity: 3 },
        { variantId: "variant-tee-m", quantity: 3 },
      ],
      levels,
    );
    expect(plan.ok).toBe(false);
    if (!plan.ok) {
      expect(plan.shortages).toEqual([
        { variantId: "variant-tee-m", requested: 6, available: 5 },
      ]);
    }
  });

  it("treats unknown variants as zero stock", () => {
    const plan = planStockDecrements([{ variantId: "ghost", quantity: 1 }], levels);
    expect(plan.ok).toBe(false);
    if (!plan.ok) {
      expect(plan.shortages[0]).toEqual({ variantId: "ghost", requested: 1, available: 0 });
    }
  });

  it("allows buying the exact remaining stock", () => {
    const plan = planStockDecrements([{ variantId: "variant-mug", quantity: 2 }], levels);
    expect(plan.ok).toBe(true);
  });

  it("rejects zero, negative and fractional quantities outright", () => {
    expect(() => planStockDecrements([{ variantId: "variant-mug", quantity: 0 }], levels)).toThrow();
    expect(() => planStockDecrements([{ variantId: "variant-mug", quantity: -1 }], levels)).toThrow();
    expect(() => planStockDecrements([{ variantId: "variant-mug", quantity: 1.5 }], levels)).toThrow();
  });
});

describe("isLowStock", () => {
  it("flags stock at or below the threshold", () => {
    expect(isLowStock(5, 5)).toBe(true);
    expect(isLowStock(0, 5)).toBe(true);
    expect(isLowStock(6, 5)).toBe(false);
  });
});

describe("canAdjustStock (manual adjustments)", () => {
  it("allows restocks and deductions that keep stock non-negative", () => {
    expect(canAdjustStock(10, 25)).toBe(true);
    expect(canAdjustStock(10, -10)).toBe(true);
  });

  it("blocks adjustments that would drive stock negative", () => {
    expect(canAdjustStock(10, -11)).toBe(false);
  });

  it("blocks zero and fractional deltas", () => {
    expect(canAdjustStock(10, 0)).toBe(false);
    expect(canAdjustStock(10, 1.5)).toBe(false);
  });
});
