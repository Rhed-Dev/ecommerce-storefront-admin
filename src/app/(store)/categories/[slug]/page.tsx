import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma, safeQuery } from "@/lib/db";
import { toCardData } from "@/lib/catalog";
import { ProductCard } from "@/components/products/product-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;

  const category = await safeQuery(
    () =>
      getPrisma().category.findUnique({
        where: { slug },
        include: {
          products: {
            include: {
              category: true,
              variants: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    null,
  );

  if (!category) notFound();

  const cards = category.products.map(toCardData);

  return (
    <div className="mx-auto max-w-site space-y-8 px-4 py-10 sm:px-6">
      <div>
        <Link href="/products" className="text-sm text-zinc-500 transition-colors hover:text-white">
          ← All products
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-white">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">{category.description}</p>
        )}
      </div>

      {cards.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing here yet"
          description="This category has no products at the moment. Check back soon or browse the full collection."
          actionHref="/products"
          actionLabel="Browse all products"
        />
      )}
    </div>
  );
}
