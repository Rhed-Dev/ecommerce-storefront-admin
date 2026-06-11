import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import type { ProductCardData } from "@/components/products/product-card";

export const PRODUCTS_PAGE_SIZE = 12;

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "name";

export interface CatalogQuery {
  search: string;
  categorySlug: string;
  sort: CatalogSort;
  page: number;
}

export interface CatalogResult {
  products: ProductCardData[];
  total: number;
  totalPages: number;
  page: number;
}

const PRODUCT_INCLUDE = {
  category: true,
  variants: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

export function toCardData(product: ProductWithRelations): ProductCardData {
  const prices = product.variants.map((v) => v.priceCents);
  return {
    slug: product.slug,
    name: product.name,
    categoryName: product.category.name,
    imageUrl: product.images[0]?.url ?? null,
    imageAlt: product.images[0]?.alt ?? null,
    minPriceCents: prices.length > 0 ? Math.min(...prices) : 0,
    maxPriceCents: prices.length > 0 ? Math.max(...prices) : 0,
    totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
  };
}

/**
 * Catalog query with search, category filter, price/name/date sort and paging.
 *
 * Price sorting orders by the cheapest variant. Prisma cannot order by a
 * relation aggregate (MIN of variant prices), so matching rows are fetched
 * and sorted in process — a deliberate trade-off that stays simple and is
 * perfectly fine at demo-catalog scale (bounded by `take: 500`).
 */
export async function queryCatalog(query: CatalogQuery): Promise<CatalogResult> {
  const prisma = getPrisma();

  const where: Prisma.ProductWhereInput = {
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
  };

  const rows = await prisma.product.findMany({
    where,
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const cards = rows.map(toCardData);

  switch (query.sort) {
    case "price-asc":
      cards.sort((a, b) => a.minPriceCents - b.minPriceCents);
      break;
    case "price-desc":
      cards.sort((a, b) => b.minPriceCents - a.minPriceCents);
      break;
    case "name":
      cards.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "newest":
    default:
      break; // already newest-first from the DB
  }

  const total = cards.length;
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * PRODUCTS_PAGE_SIZE;

  return {
    products: cards.slice(start, start + PRODUCTS_PAGE_SIZE),
    total,
    totalPages,
    page,
  };
}

export function parseCatalogSearchParams(params: Record<string, string | string[] | undefined>): CatalogQuery {
  const single = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

  const sortRaw = single(params.sort);
  const sort: CatalogSort = ["newest", "price-asc", "price-desc", "name"].includes(sortRaw)
    ? (sortRaw as CatalogSort)
    : "newest";

  const pageRaw = Number.parseInt(single(params.page), 10);

  return {
    search: single(params.q).slice(0, 100),
    categorySlug: single(params.category).slice(0, 100),
    sort,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}
