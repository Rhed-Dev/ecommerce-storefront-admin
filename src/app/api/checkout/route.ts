import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { appBaseUrl } from "@/lib/env";
import { getCartWithItems } from "@/lib/cart";
import { getSessionUser } from "@/lib/guard";
import { jsonError, jsonOk } from "@/lib/api";
import { cartTotals } from "@/lib/money";
import { planStockDecrements } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/**
 * Creates a Stripe Checkout Session for the current cart.
 *
 * Prices come exclusively from the database — the client sends nothing but
 * the request itself, so a tampered request body can never change what is
 * charged. The cart id travels in session metadata and is resolved again by
 * the webhook, which is the only place orders are created.
 */
export async function POST() {
  const cart = await getCartWithItems();
  if (!cart || cart.items.length === 0) {
    return jsonError(400, "Your cart is empty");
  }

  // Fail fast on stock that has run out since items were added. The webhook
  // re-checks atomically; this check just gives shoppers an early, clear error.
  const plan = planStockDecrements(
    cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    new Map(cart.items.map((item) => [item.variantId, item.variant.stock])),
  );
  if (!plan.ok) {
    return jsonError(409, "Some items in your cart are no longer available", plan.shortages);
  }

  const totals = cartTotals(
    cart.items.map((item) => ({ unitPriceCents: item.variant.priceCents, quantity: item.quantity })),
  );

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "usd",
      unit_amount: item.variant.priceCents, // DB price — never client input
      product_data: {
        name: `${item.variant.product.name} — ${item.variant.name}`,
        ...(item.variant.product.images[0]?.url
          ? { images: [item.variant.product.images[0].url] }
          : {}),
      },
    },
  }));

  if (totals.shippingCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: totals.shippingCents,
        product_data: { name: "Shipping" },
      },
    });
  }

  const user = await getSessionUser();
  const baseUrl = appBaseUrl();

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancelled`,
      ...(user?.email ? { customer_email: user.email } : {}),
      metadata: {
        cartId: cart.id,
        userId: user?.id ?? "",
      },
    });
    return jsonOk({ url: session.url });
  } catch (error) {
    console.error("[checkout] failed to create Stripe session:", error);
    return jsonError(502, "Could not start checkout. Please try again.");
  }
}
