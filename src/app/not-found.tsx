import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">404</p>
      <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">This page wandered off</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
        The page you are looking for does not exist or has been moved. The collection, however, is
        exactly where you left it.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back to the storefront
      </Link>
    </div>
  );
}
