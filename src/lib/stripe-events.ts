/**
 * Stripe webhook idempotency logic.
 *
 * Stripe retries webhook deliveries until it receives a 2xx, so the same
 * event can arrive more than once (and occasionally concurrently). The
 * database enforces exactly-once processing via a UNIQUE constraint on
 * ProcessedStripeEvent.eventId; this module holds the pure decision logic
 * so it can be unit-tested without a database.
 */

const STRIPE_EVENT_ID_PATTERN = /^evt_[A-Za-z0-9]+$/;

export function isValidStripeEventId(eventId: string): boolean {
  return STRIPE_EVENT_ID_PATTERN.test(eventId);
}

/**
 * In-memory mirror of the processed-events ledger. `register` returns false
 * when the event was already recorded — the caller must treat that delivery
 * as a duplicate and skip all side effects.
 */
export class ProcessedEventRegistry {
  private readonly seen: Set<string>;

  constructor(initial: Iterable<string> = []) {
    this.seen = new Set(initial);
  }

  has(eventId: string): boolean {
    return this.seen.has(eventId);
  }

  /** Record an event id. Returns true if newly recorded, false if duplicate. */
  register(eventId: string): boolean {
    if (!isValidStripeEventId(eventId)) {
      throw new Error(`Malformed Stripe event id: "${eventId}"`);
    }
    if (this.seen.has(eventId)) return false;
    this.seen.add(eventId);
    return true;
  }

  get size(): number {
    return this.seen.size;
  }
}
