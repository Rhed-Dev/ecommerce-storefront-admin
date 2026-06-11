import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/guard";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { productInputSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  const parsed = await parseJsonBody(req, productInputSchema);
  if (!parsed.ok) return parsed.response;

  const { variants, images, ...productData } = parsed.data;
  const prisma = getPrisma();

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: { select: { id: true } } },
  });
  if (!existing) return jsonError(404, "Product not found");

  const keptVariantIds = variants.filter((v) => v.id).map((v) => v.id as string);

  try {
    const product = await prisma.$transaction(async (tx) => {
      // Remove variants dropped in the editor. Order items keep their snapshot
      // (variantId becomes NULL via onDelete: SetNull) so history is preserved.
      await tx.productVariant.deleteMany({
        where: { productId: id, id: { notIn: keptVariantIds } },
      });

      for (const variant of variants) {
        const { id: variantId, ...data } = variant;
        if (variantId) {
          await tx.productVariant.update({ where: { id: variantId }, data });
        } else {
          await tx.productVariant.create({ data: { ...data, productId: id } });
        }
      }

      // Images are replaced wholesale — the form always submits the full list.
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({ ...image, productId: id, sortOrder: index })),
        });
      }

      return tx.product.update({
        where: { id },
        data: productData,
        include: { variants: true, images: { orderBy: { sortOrder: "asc" } } },
      });
    });
    return jsonOk({ product });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(409, "A product with this slug or SKU already exists");
    }
    throw error;
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const prisma = getPrisma();

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return jsonError(404, "Product not found");

  await prisma.product.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
