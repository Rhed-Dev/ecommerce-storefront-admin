import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma, safeQuery } from "@/lib/db";
import { ProductGallery } from "@/components/products/gallery";
import { AddToCart } from "@/components/products/add-to-cart";
import { FREE_SHIPPING_THRESHOLD_CENTS, formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  const product = await safeQuery(
    () =>
      getPrisma().product.findUnique({
        where: { slug },
        include: {
          category: true,
          variants: { orderBy: { priceCents: "asc" } },
          images: { orderBy: { sortOrder: "asc" } },
        },
      }),
    null,
  );

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-site px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-500">
        <Link href="/products" className="transition-colors hover:text-white">
          Shop
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <Link
          href={`/categories/${product.category.slug}`}
          className="transition-colors hover:text-white"
        >
          {product.category.name}
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span className="text-zinc-300">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images.map((image) => ({ url: image.url, alt: image.alt }))}
          productName={product.name}
        />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            {product.category.name}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-8">
            <AddToCart
              variants={product.variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                priceCents: variant.priceCents,
                stock: variant.stock,
              }))}
            />
          </div>

          <div className="mt-10 border-t border-zinc-800 pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
              About this item
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {product.description}
            </p>
          </div>

          <ul className="mt-8 space-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-amber-300">✓</span>
              Free shipping on orders over {formatCents(FREE_SHIPPING_THRESHOLD_CENTS)}
            </li>
            <li className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-amber-300">✓</span>
              Secure checkout via Stripe (test mode)
            </li>
            <li className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-amber-300">✓</span>
              Live stock — what you see is what the warehouse has
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
