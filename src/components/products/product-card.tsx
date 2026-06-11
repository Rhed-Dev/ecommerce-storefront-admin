import Link from "next/link";
import { formatCents } from "@/lib/money";

export interface ProductCardData {
  slug: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  imageAlt: string | null;
  minPriceCents: number;
  maxPriceCents: number;
  totalStock: number;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const priceLabel =
    product.minPriceCents === product.maxPriceCents
      ? formatCents(product.minPriceCents)
      : `from ${formatCents(product.minPriceCents)}`;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card group overflow-hidden transition-colors hover:border-zinc-600"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
        {product.imageUrl ? (
          // Plain <img>: image URLs are stored at upload time, so no runtime
          // image-optimization service is required to render the catalog.
          <img
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-4xl font-bold text-zinc-600">
            {product.name.charAt(0)}
          </div>
        )}
        {product.totalStock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-zinc-950/90 px-2.5 py-1 text-xs font-semibold text-red-300">
            Sold out
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">{product.categoryName}</p>
        <h3 className="mt-1 truncate text-sm font-semibold text-white">{product.name}</h3>
        <p className="mt-1.5 text-sm font-medium text-amber-300">{priceLabel}</p>
      </div>
    </Link>
  );
}
