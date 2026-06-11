import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guard";
import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect("/");

  return (
    <div className="px-4 py-16 sm:px-6">
      <RegisterForm />
    </div>
  );
}
