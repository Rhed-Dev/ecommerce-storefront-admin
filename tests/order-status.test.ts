import { describe, expect, it } from "vitest";
import {
  ORDER_FLOW,
  ORDER_STATUSES,
  assertTransition,
  canTransition,
  flowIndex,
  isOrderStatus,
  nextStatuses,
} from "@/lib/orders";

describe("order status transitions", () => {
  it("walks the full happy path PENDING -> ... -> DELIVERED", () => {
    for (let i = 0; i < ORDER_FLOW.length - 1; i += 1) {
      const from = ORDER_FLOW[i];
      const to = ORDER_FLOW[i + 1];
      expect(from && to && canTransition(from, to)).toBe(true);
    }
  });

  it("forbids skipping steps forward", () => {
    expect(canTransition("PENDING", "FULFILLED")).toBe(false);
    expect(canTransition("PAID", "SHIPPED")).toBe(false);
    expect(canTransition("PAID", "DELIVERED")).toBe(false);
  });

  it("forbids moving backwards", () => {
    expect(canTransition("SHIPPED", "PAID")).toBe(false);
    expect(canTransition("DELIVERED", "SHIPPED")).toBe(false);
    expect(canTransition("PAID", "PENDING")).toBe(false);
  });

  it("allows cancelling only before fulfilment", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
    expect(canTransition("PAID", "CANCELLED")).toBe(true);
    expect(canTransition("FULFILLED", "CANCELLED")).toBe(false);
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
  });

  it("allows refunding any paid-for state but never an unpaid one", () => {
    expect(canTransition("PAID", "REFUNDED")).toBe(true);
    expect(canTransition("FULFILLED", "REFUNDED")).toBe(true);
    expect(canTransition("SHIPPED", "REFUNDED")).toBe(true);
    expect(canTransition("DELIVERED", "REFUNDED")).toBe(true);
    expect(canTransition("PENDING", "REFUNDED")).toBe(false);
  });

  it("treats CANCELLED and REFUNDED as terminal", () => {
    for (const to of ORDER_STATUSES) {
      expect(canTransition("CANCELLED", to)).toBe(false);
      expect(canTransition("REFUNDED", to)).toBe(false);
    }
    expect(nextStatuses("CANCELLED")).toHaveLength(0);
    expect(nextStatuses("REFUNDED")).toHaveLength(0);
  });

  it("never allows a self-transition", () => {
    for (const status of ORDER_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it("assertTransition throws a descriptive error on invalid moves", () => {
    expect(() => assertTransition("DELIVERED", "PENDING")).toThrow(/DELIVERED -> PENDING/);
    expect(() => assertTransition("PAID", "FULFILLED")).not.toThrow();
  });
});

describe("status helpers", () => {
  it("validates raw strings as statuses", () => {
    expect(isOrderStatus("PAID")).toBe(true);
    expect(isOrderStatus("paid")).toBe(false);
    expect(isOrderStatus("ARCHIVED")).toBe(false);
  });

  it("maps statuses to their happy-path index for the timeline UI", () => {
    expect(flowIndex("PENDING")).toBe(0);
    expect(flowIndex("DELIVERED")).toBe(4);
    expect(flowIndex("CANCELLED")).toBe(-1);
    expect(flowIndex("REFUNDED")).toBe(-1);
  });
});
