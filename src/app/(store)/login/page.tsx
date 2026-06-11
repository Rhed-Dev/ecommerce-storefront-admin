import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guard";
import { googleAuthEnabled } from "@/lib/env";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Promise<{ callbackUrl?: string }>;

/** Only allow same-site relative redirect targets. */
function sanitizeCallbackUrl(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getSessionUser().catch(() => null);
  const { callbackUrl } = await searchParams;
  const target = sanitizeCallbackUrl(callbackUrl);

  if (user) redirect(target);

  return (
    <div className="px-4 py-16 sm:px-6">
      <LoginForm callbackUrl={target} googleEnabled={googleAuthEnabled()} />
    </div>
  );
}
