import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { getStripe } from "@/lib/stripe";
import { requireEnv } from "@/lib/env";
import { getPrisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { cartTotals } from "@/lib/money";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook: the single place orders are created.
 *
 * Guarantees:
 *  1. Signature verification — unsigned/forged payloads are rejected with 400.
 *  2. Idempotency — the event id is inserted into ProcessedStripeEvent inside
 *     the same transaction as all side effects. A replayed delivery hits the
 *     UNIQUE constraint, the transaction aborts, and we acknowledge with 200.
 *  3. Atomic inventory decrement — each variant row is decremented with a
 *     conditional UPDATE (`stock >= quantity`). Zero affected rows means a
 *     concurrent checkout won the stock; the whole transaction rolls back.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return jsonError(400, "Missing stripe-signature header");

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    return jsonError(400, "Webhook signature verification failed");
  }

  if (event.type !== "checkout.session.completed") {
    return jsonOk({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const cartId = session.metadata?.cartId;
  const userId = session.metadata?.userId || null;
  const email = session.customer_details?.email ?? session.customer_email ?? "unknown@example.com";

  if (!cartId) return jsonError(400, "Checkout session is missing cartId metadata");

  const prisma = getPrisma();

  try {
    await prisma.$transaction(async (tx) => {
      // Idempotency lock: the unique insert is the first statement, so any
      // replay (even a concurrent one) aborts here before side effects run.
      await tx.processedStripeEvent.create({
        data: { eventId: event.id, type: event.type },
      });

      const cart = await tx.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { variant: { include: { product: true } } } } },
      });
      if (!cart || cart.items.length === 0) return; // cart already consumed

      const totals = cartTotals(
        cart.items.map((item) => ({
          unitPriceCents: item.variant.priceCents,
          quantity: item.quantity,
        })),
      );

      const order = await tx.order.create({
        data: {
          userId,
          email,
          status: "PAID",
          subtotalCents: totals.subtotalCents,
          shippingCents: totals.shippingCents,
          totalCents: session.amount_total ?? totals.totalCents,
          stripeSessionId: session.id,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              // Snapshot name + price now; future price edits must not rewrite history.
              productName: item.variant.product.name,
              variantName: item.variant.name,
              unitPriceCents: item.variant.priceCents,
              quantity: item.quantity,
            })),
          },
        },
      });

      for (const item of cart.items) {
        // Conditional decrement: only succeeds while stock covers the quantity.
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new Error(`Insufficient stock for variant ${item.variantId} (oversell guard)`);
        }
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId,
            delta: -item.quantity,
            kind: "SALE",
            reason: `Order #${order.number}`,
            orderId: order.id,
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });
    });
  } catch (error) {
    // P2002 = unique violation on eventId: a duplicate delivery. Acknowledge it.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonOk({ received: true, duplicate: true });
    }
    console.error("[webhook] processing failed:", error);
    // Non-2xx tells Stripe to retry with backoff; the transaction rolled back
    // (including the event-id insert), so the retry reprocesses cleanly.
    return jsonError(500, "Webhook processing failed; Stripe will retry");
  }

  return jsonOk({ received: true });
}
