import { describe, expect, it } from "vitest";
import { ProcessedEventRegistry, isValidStripeEventId } from "@/lib/stripe-events";

describe("isValidStripeEventId", () => {
  it("accepts well-formed Stripe event ids", () => {
    expect(isValidStripeEventId("evt_1PXYZAbCdEfGhIjK")).toBe(true);
    expect(isValidStripeEventId("evt_abc123")).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(isValidStripeEventId("")).toBe(false);
    expect(isValidStripeEventId("evt_")).toBe(false);
    expect(isValidStripeEventId("cs_test_123")).toBe(false);
    expect(isValidStripeEventId("evt_abc-123")).toBe(false);
    expect(isValidStripeEventId("EVT_ABC123")).toBe(false);
  });
});

describe("ProcessedEventRegistry (webhook idempotency)", () => {
  it("registers a fresh event exactly once", () => {
    const registry = new ProcessedEventRegistry();
    expect(registry.register("evt_first")).toBe(true);
    expect(registry.has("evt_first")).toBe(true);
    expect(registry.size).toBe(1);
  });

  it("returns false for a replayed delivery — the caller must skip side effects", () => {
    const registry = new ProcessedEventRegistry();
    expect(registry.register("evt_replay")).toBe(true);
    expect(registry.register("evt_replay")).toBe(false);
    expect(registry.size).toBe(1);
  });

  it("seeds from previously processed ids (mirrors the DB unique index)", () => {
    const registry = new ProcessedEventRegistry(["evt_old1", "evt_old2"]);
    expect(registry.has("evt_old1")).toBe(true);
    expect(registry.register("evt_old2")).toBe(false);
    expect(registry.register("evt_new")).toBe(true);
    expect(registry.size).toBe(3);
  });

  it("keeps distinct events independent", () => {
    const registry = new ProcessedEventRegistry();
    expect(registry.register("evt_a")).toBe(true);
    expect(registry.register("evt_b")).toBe(true);
    expect(registry.register("evt_a")).toBe(false);
    expect(registry.size).toBe(2);
  });

  it("refuses to register malformed ids instead of silently accepting them", () => {
    const registry = new ProcessedEventRegistry();
    expect(() => registry.register("not-an-event")).toThrow(/Malformed/);
    expect(registry.size).toBe(0);
  });
});
