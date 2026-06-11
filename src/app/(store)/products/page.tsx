import type { Metadata } from "next";
import { getPrisma, safeQuery } from "@/lib/db";
import { parseCatalogSearchParams, queryCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/filters";
import { Pagination } from "@/components/products/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shop" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = parseCatalogSearchParams(params);

  const [result, categories] = await Promise.all([
    safeQuery(() => queryCatalog(query), { products: [], total: 0, totalPages: 1, page: 1 }),
    safeQuery(
      () => getPrisma().category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
      [],
    ),
  ]);

  const persistedParams: Record<string, string> = {
    ...(query.search ? { q: query.search } : {}),
    ...(query.categorySlug ? { category: query.categorySlug } : {}),
    ...(query.sort !== "newest" ? { sort: query.sort } : {}),
  };

  return (
    <div className="mx-auto max-w-site space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Shop</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          {result.total} {result.total === 1 ? "product" : "products"}
          {query.search ? ` matching “${query.search}”` : ""}
        </p>
      </div>

      <ProductFilters
        categories={categories}
        search={query.search}
        category={query.categorySlug}
        sort={query.sort}
      />

      {result.products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {result.products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/products"
            searchParams={persistedParams}
          />
        </>
      ) : (
        <EmptyState
          icon={<span aria-hidden="true">🔍</span>}
          title="No products found"
          description={
            query.search || query.categorySlug
              ? "Nothing matches those filters. Try a different search or clear the category."
              : "The catalog is empty. Seed the database to load the demo collection."
          }
          actionHref="/products"
          actionLabel="Clear filters"
        />
      )}
    </div>
  );
}
