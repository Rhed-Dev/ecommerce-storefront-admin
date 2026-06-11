import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string>;
}

function pageHref(basePath: string, params: Record<string, string>, page: number): string {
  const query = new URLSearchParams({ ...params, page: String(page) });
  return `${basePath}?${query.toString()}`;
}

export function Pagination({ page, totalPages, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      <Link
        href={pageHref(basePath, searchParams, Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn("btn-secondary px-3", page === 1 && "pointer-events-none opacity-40")}
      >
        ←
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(basePath, searchParams, p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
            p === page
              ? "bg-amber-400 text-zinc-950"
              : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500",
          )}
        >
          {p}
        </Link>
      ))}
      <Link
        href={pageHref(basePath, searchParams, Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={cn("btn-secondary px-3", page === totalPages && "pointer-events-none opacity-40")}
      >
        →
      </Link>
    </nav>
  );
}
