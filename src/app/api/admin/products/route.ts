import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/guard";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { productInputSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = await parseJsonBody(req, productInputSchema);
  if (!parsed.ok) return parsed.response;

  const { variants, images, ...productData } = parsed.data;
  const prisma = getPrisma();

  const category = await prisma.category.findUnique({ where: { id: productData.categoryId } });
  if (!category) return jsonError(400, "Unknown category");

  try {
    const product = await prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: variants.map(({ id: _ignored, ...variant }) => variant),
        },
        images: {
          create: images.map((image, index) => ({ ...image, sortOrder: index })),
        },
      },
      include: { variants: true, images: true },
    });
    return jsonOk({ product }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(409, "A product with this slug or SKU already exists");
    }
    throw error;
  }
}
