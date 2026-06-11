"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

export function LoginForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password");
      setPending(false);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="card mx-auto w-full max-w-md p-8">
      <h1 className="text-2xl font-bold text-white">Welcome back</h1>
      <p className="mt-1.5 text-sm text-zinc-400">Sign in to view orders and check out faster.</p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-7 space-y-4">
        <div>
          <label htmlFor="login-email" className="label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="label">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full py-3">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-zinc-500">
            <span className="h-px flex-1 bg-zinc-800" />
            or
            <span className="h-px flex-1 bg-zinc-800" />
          </div>
          <button
            type="button"
            onClick={() => void signIn("google", { callbackUrl })}
            className="btn-secondary w-full py-3"
          >
            Continue with Google
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-zinc-400">
        New here?{" "}
        <Link href="/register" className="font-semibold text-amber-300 hover:text-amber-200">
          Create an account
        </Link>
      </p>

      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-xs leading-relaxed text-zinc-400">
        <p className="font-semibold text-zinc-300">Demo accounts (after seeding)</p>
        <p>Admin: admin@atelier.test / admin1234</p>
        <p>Customer: maya@example.com / customer1234</p>
      </div>
    </div>
  );
}
