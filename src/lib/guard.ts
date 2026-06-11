import { getServerSession } from "next-auth";
import type { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export interface SessionUser {
  id: string;
  role: "CUSTOMER" | "ADMIN";
  email: string | null;
  name: string | null;
}

/** Current session user, or null when not signed in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}

type GuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * API-route guard for admin endpoints. The /admin pages are additionally
 * protected by middleware, but API routes enforce the role themselves —
 * defense in depth rather than trusting a single layer.
 */
export async function requireAdminApi(): Promise<GuardResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, response: jsonError(401, "Authentication required") };
  if (user.role !== "ADMIN") return { ok: false, response: jsonError(403, "Admin access required") };
  return { ok: true, user };
}
