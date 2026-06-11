import Link from "next/link";
import { CartBadge } from "@/components/site/cart-badge";
import { NavAuth } from "@/components/site/nav-auth";

const NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/products?sort=newest", label: "New arrivals" },
  { href: "/#categories", label: "Categories" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-site items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold uppercase tracking-[0.25em] text-white">
          Atelier<span className="text-amber-400">.</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <NavAuth />
          <CartBadge />
        </div>
      </div>
    </header>
  );
}
