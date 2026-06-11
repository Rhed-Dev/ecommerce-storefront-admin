import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { cloudinaryEnabled } from "@/lib/env";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const prisma = getPrisma();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { priceCents: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit product</h1>
        <p className="mt-1 text-sm text-zinc-400">{product.name}</p>
      </div>

      <ProductForm
        cloudinaryConfigured={cloudinaryEnabled()}
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          featured: product.featured,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            priceDollars: (variant.priceCents / 100).toFixed(2),
            stock: String(variant.stock),
            lowStockThreshold: String(variant.lowStockThreshold),
          })),
          images: product.images.map((image) => ({
            publicId: image.publicId,
            url: image.url,
            alt: image.alt ?? "",
          })),
        }}
      />
    </div>
  );
}
