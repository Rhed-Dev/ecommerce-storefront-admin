import { cookies } from "next/headers";
import type { Cart, Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";

export const CART_COOKIE = "cartId";

const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          product: { include: { images: { orderBy: { sortOrder: "asc" } } } },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;

/** Read the anonymous cart id cookie (no DB access). */
export async function readCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** Load the current cart with items, variants and product images. */
export async function getCartWithItems(): Promise<CartWithItems | null> {
  const cartId = await readCartId();
  if (!cartId) return null;
  return getPrisma().cart.findUnique({ where: { id: cartId }, include: CART_INCLUDE });
}

/**
 * Find the cart referenced by the cookie or create a new one. Only callable
 * from route handlers (cookie writes are not allowed in server components).
 */
export async function getOrCreateCart(userId?: string | null): Promise<Cart> {
  const store = await cookies();
  const prisma = getPrisma();

  const existingId = store.get(CART_COOKIE)?.value;
  if (existingId) {
    const existing = await prisma.cart.findUnique({ where: { id: existingId } });
    if (existing) {
      // Attach the cart to the user on first authenticated interaction.
      if (userId && existing.userId !== userId) {
        return prisma.cart.update({ where: { id: existing.id }, data: { userId } });
      }
      return existing;
    }
  }

  const cart = await prisma.cart.create({ data: { userId: userId ?? null } });
  store.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart;
}
