import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getPrisma().product.findMany({
    include: {
      category: true,
      variants: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="mt-1 text-sm text-zinc-400">{products.length} in catalog</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create your first product or seed the database with the demo catalog."
          actionHref="/admin/products/new"
          actionLabel="Create a product"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="table-th">Product</th>
                <th className="table-th">Category</th>
                <th className="table-th">Price</th>
                <th className="table-th">Variants</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Featured</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {products.map((product) => {
                const prices = product.variants.map((v) => v.priceCents);
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                const image = product.images[0];
                return (
                  <tr key={product.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800">
                          {image ? (
                            <img
                              src={image.url}
                              alt={image.alt ?? product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-600">
                              {product.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{product.name}</p>
                          <p className="truncate text-xs text-zinc-500">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">{product.category.name}</td>
                    <td className="table-td">from {formatCents(minPrice)}</td>
                    <td className="table-td">{product.variants.length}</td>
                    <td className="table-td">
                      <span className={totalStock === 0 ? "font-semibold text-red-300" : ""}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="table-td">{product.featured ? "★" : "—"}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-amber-400/60 hover:text-amber-300"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
