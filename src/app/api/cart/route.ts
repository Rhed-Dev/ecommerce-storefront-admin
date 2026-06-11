import { getPrisma } from "@/lib/db";
import { getCartWithItems, getOrCreateCart } from "@/lib/cart";
import { getSessionUser } from "@/lib/guard";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { addToCartSchema } from "@/lib/validators";
import { cartTotals } from "@/lib/money";

export const dynamic = "force-dynamic";

/** Shape the cart for the client: items + integer-cent totals computed server-side. */
function serializeCart(cart: Awaited<ReturnType<typeof getCartWithItems>>) {
  if (!cart) {
    return { items: [], totals: cartTotals([]), itemCount: 0 };
  }
  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variant: {
      id: item.variant.id,
      name: item.variant.name,
      priceCents: item.variant.priceCents,
      stock: item.variant.stock,
      product: {
        name: item.variant.product.name,
        slug: item.variant.product.slug,
        imageUrl: item.variant.product.images[0]?.url ?? null,
      },
    },
  }));
  const totals = cartTotals(
    cart.items.map((item) => ({ unitPriceCents: item.variant.priceCents, quantity: item.quantity })),
  );
  return { items, totals, itemCount: items.reduce((n, item) => n + item.quantity, 0) };
}

export async function GET() {
  const cart = await getCartWithItems();
  return jsonOk(serializeCart(cart));
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, addToCartSchema);
  if (!parsed.ok) return parsed.response;

  const { variantId, quantity } = parsed.data;
  const prisma = getPrisma();

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return jsonError(404, "Product variant not found");

  const user = await getSessionUser();
  const cart = await getOrCreateCart(user?.id);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });
  const requestedTotal = (existing?.quantity ?? 0) + quantity;

  if (requestedTotal > variant.stock) {
    return jsonError(409, `Only ${variant.stock} left in stock`, {
      available: variant.stock,
      requested: requestedTotal,
    });
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: requestedTotal },
    create: { cartId: cart.id, variantId, quantity },
  });

  const updated = await getCartWithItems();
  return jsonOk(serializeCart(updated), 201);
}
