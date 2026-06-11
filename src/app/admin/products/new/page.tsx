import { getPrisma } from "@/lib/db";
import { cloudinaryEnabled } from "@/lib/env";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getPrisma().category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New product</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Prices are entered in dollars and stored as integer cents.
        </p>
      </div>

      <ProductForm
        cloudinaryConfigured={cloudinaryEnabled()}
        categories={categories}
        initial={{
          name: "",
          slug: "",
          description: "",
          categoryId: categories[0]?.id ?? "",
          featured: false,
          variants: [{ name: "", sku: "", priceDollars: "", stock: "0", lowStockThreshold: "5" }],
          images: [],
        }}
      />
    </div>
  );
}
