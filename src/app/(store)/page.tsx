import Link from "next/link";
import { getPrisma, safeQuery } from "@/lib/db";
import { ProductCard, type ProductCardData } from "@/components/products/product-card";
import { FREE_SHIPPING_THRESHOLD_CENTS, formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

const VALUE_PROPS = [
  {
    title: `Free shipping over ${formatCents(FREE_SHIPPING_THRESHOLD_CENTS)}`,
    body: "Flat $5.99 below that — calculated server-side, never in the browser.",
    icon: "⛟",
  },
  {
    title: "Secure Stripe checkout",
    body: "Prices come from the database and payments are verified by signed webhooks.",
    icon: "▣",
  },
  {
    title: "Honest stock counts",
    body: "Atomic inventory decrements mean two shoppers can never buy the last unit twice.",
    icon: "◧",
  },
] as const;

async function getHomeData() {
  const prisma = getPrisma();
  const [featured, categories] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
  ]);
  return { featured, categories };
}

export default async function HomePage() {
  const { featured, categories } = await safeQuery(getHomeData, { featured: [], categories: [] });

  const featuredCards: ProductCardData[] = featured.map((product) => ({
    slug: product.slug,
    name: product.name,
    categoryName: product.category.name,
    imageUrl: product.images[0]?.url ?? null,
    imageAlt: product.images[0]?.alt ?? null,
    minPriceCents: Math.min(...product.variants.map((v) => v.priceCents), Infinity) || 0,
    maxPriceCents: Math.max(...product.variants.map((v) => v.priceCents), 0),
    totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
  }));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800/80">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
        />
        <div className="mx-auto max-w-site px-4 py-24 sm:px-6 sm:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            New season · Considered goods
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Everyday objects, made to be kept.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Apparel, homeware and stationery built around one idea: buy fewer, better things.
            Browse the collection, pay with Stripe, track every order to your door.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary px-6 py-3 text-base">
              Shop the collection
            </Link>
            <Link href="#categories" className="btn-secondary px-6 py-3 text-base">
              Browse categories
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-zinc-800/80 bg-zinc-900/30">
        <div className="mx-auto grid max-w-site gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="flex gap-4">
              <span aria-hidden="true" className="text-2xl text-amber-300">
                {prop.icon}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">{prop.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{prop.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-site px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Featured</h2>
            <p className="mt-1.5 text-sm text-zinc-400">Hand-picked from the current collection.</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
            View all →
          </Link>
        </div>

        {featuredCards.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featuredCards.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="card mt-8 px-6 py-14 text-center">
            <p className="text-sm text-zinc-400">
              No products yet. Start the database and run{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-amber-300">
                npx prisma migrate dev &amp;&amp; npx prisma db seed
              </code>{" "}
              to load the demo catalog.
            </p>
          </div>
        )}
      </section>

      {/* Categories */}
      <section id="categories" className="border-t border-zinc-800/80 bg-zinc-900/30">
        <div className="mx-auto max-w-site px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-white">Shop by category</h2>
          {categories.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="card group p-6 transition-colors hover:border-amber-400/50"
                >
                  <h3 className="text-base font-semibold text-white group-hover:text-amber-300">
                    {category.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-zinc-500">
                    {category._count.products}{" "}
                    {category._count.products === 1 ? "product" : "products"}
                  </p>
                  <span aria-hidden="true" className="mt-5 block text-amber-300/0 transition-colors group-hover:text-amber-300">
                    →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">Categories appear here once the database is seeded.</p>
          )}
        </div>
      </section>
    </div>
  );
}
