import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950">
      <div className="mx-auto grid max-w-site gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-bold uppercase tracking-[0.25em] text-white">
            Atelier<span className="text-amber-400">.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
            Considered goods for everyday rituals. A portfolio demo storefront — products are
            seeded sample data and checkout runs in Stripe test mode.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/products" className="text-zinc-400 transition-colors hover:text-white">
                All products
              </Link>
            </li>
            <li>
              <Link
                href="/products?sort=newest"
                className="text-zinc-400 transition-colors hover:text-white"
              >
                New arrivals
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-zinc-400 transition-colors hover:text-white">
                Cart
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Account</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/login" className="text-zinc-400 transition-colors hover:text-white">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-zinc-400 transition-colors hover:text-white">
                Create account
              </Link>
            </li>
            <li>
              <Link
                href="/account/orders"
                className="text-zinc-400 transition-colors hover:text-white"
              >
                Order history
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-800/80">
        <div className="mx-auto flex max-w-site flex-col gap-2 px-4 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 John Rhed Atienza · MIT License</p>
          <p>Built with Next.js 15, Prisma, PostgreSQL &amp; Stripe</p>
        </div>
      </div>
    </footer>
  );
}
