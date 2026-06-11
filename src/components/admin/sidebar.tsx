"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true, icon: "▦" },
  { href: "/admin/products", label: "Products", exact: false, icon: "◫" },
  { href: "/admin/inventory", label: "Inventory", exact: false, icon: "▤" },
  { href: "/admin/orders", label: "Orders", exact: false, icon: "◷" },
  { href: "/admin/customers", label: "Customers", exact: false, icon: "◉" },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950 p-3 lg:min-h-screen lg:w-60 lg:flex-col lg:border-b-0 lg:border-r lg:p-4">
      <Link
        href="/"
        className="mb-0 hidden px-3 py-2 text-base font-bold uppercase tracking-[0.25em] text-white lg:mb-4 lg:block"
      >
        Atelier<span className="text-amber-400">.</span>
        <span className="mt-1 block text-[10px] font-medium normal-case tracking-wide text-zinc-500">
          Admin panel
        </span>
      </Link>

      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-amber-400/10 text-amber-300"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white",
            )}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {link.icon}
            </span>
            {link.label}
          </Link>
        );
      })}

      <div className="ml-auto lg:ml-0 lg:mt-auto">
        <Link
          href="/"
          className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-white"
        >
          <span aria-hidden="true">←</span> Back to store
        </Link>
      </div>
    </aside>
  );
}
