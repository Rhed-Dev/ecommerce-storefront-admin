import { getPrisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/guard";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { inventoryAdjustSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * Manual stock adjustment with an audit trail.
 *
 * The decrement path uses the same conditional-update pattern as the webhook:
 * a negative adjustment only succeeds while the row still has enough stock,
 * so two admins adjusting concurrently can never drive a variant negative.
 */
export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = await parseJsonBody(req, inventoryAdjustSchema);
  if (!parsed.ok) return parsed.response;

  const { variantId, delta, reason } = parsed.data;
  const prisma = getPrisma();

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return jsonError(404, "Variant not found");

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          // Guard: never allow stock to go negative, even under concurrency.
          ...(delta < 0 ? { stock: { gte: -delta } } : {}),
        },
        data: { stock: { increment: delta } },
      });
      if (result.count === 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.inventoryLog.create({
        data: {
          variantId,
          delta,
          kind: delta > 0 ? "RESTOCK" : "MANUAL",
          reason: `${reason} (by ${guard.user.email ?? guard.user.id})`,
        },
      });

      return tx.productVariant.findUniqueOrThrow({
        where: { id: variantId },
        select: { id: true, sku: true, stock: true, lowStockThreshold: true },
      });
    });
    return jsonOk({ variant: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return jsonError(409, "Adjustment would make stock negative", {
        currentStock: variant.stock,
        delta,
      });
    }
    throw error;
  }
}
