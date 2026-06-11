import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

/**
 * Lazy Stripe client.
 *
 * Instantiated inside request handlers on first use, never at import time,
 * so builds succeed without STRIPE_SECRET_KEY. The api version is the one
 * pinned by the installed SDK, which keeps types and runtime in sync.
 */
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  }
  return stripeClient;
}
