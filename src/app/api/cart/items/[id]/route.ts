import { getPrisma } from "@/lib/db";
import { readCartId } from "@/lib/cart";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateCartItemSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Load a cart item only if it belongs to the cart referenced by this browser's cookie. */
async function findOwnedItem(itemId: string) {
  const cartId = await readCartId();
  if (!cartId) return null;
  const item = await getPrisma().cartItem.findUnique({
    where: { id: itemId },
    include: { variant: true },
  });
  if (!item || item.cartId !== cartId) return null;
  return item;
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;

  const parsed = await parseJsonBody(req, updateCartItemSchema);
  if (!parsed.ok) return parsed.response;

  const item = await findOwnedItem(id);
  if (!item) return jsonError(404, "Cart item not found");

  const prisma = getPrisma();
  const { quantity } = parsed.data;

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return jsonOk({ removed: true });
  }

  if (quantity > item.variant.stock) {
    return jsonError(409, `Only ${item.variant.stock} left in stock`, {
      available: item.variant.stock,
    });
  }

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
    select: { id: true, quantity: true },
  });
  return jsonOk(updated);
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  const item = await findOwnedItem(id);
  if (!item) return jsonError(404, "Cart item not found");

  await getPrisma().cartItem.delete({ where: { id: item.id } });
  return jsonOk({ removed: true });
}
