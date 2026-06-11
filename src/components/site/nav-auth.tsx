"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function NavAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-20 animate-pulse rounded-lg bg-zinc-800/80" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-1">
        <Link href="/login" className="btn-ghost hidden sm:inline-flex">
          Sign in
        </Link>
        <Link href="/register" className="btn-primary hidden px-3 py-2 sm:inline-flex">
          Create account
        </Link>
        <Link href="/login" className="btn-ghost sm:hidden">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {session.user.role === "ADMIN" && (
        <Link href="/admin" className="btn-ghost hidden sm:inline-flex">
          Admin
        </Link>
      )}
      <Link href="/account/orders" className="btn-ghost">
        Orders
      </Link>
      <button type="button" onClick={() => void signOut({ callbackUrl: "/" })} className="btn-ghost">
        Sign out
      </button>
    </div>
  );
}
