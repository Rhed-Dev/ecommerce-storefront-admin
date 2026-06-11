"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string; details?: Record<string, string[]> };
        } | null;
        const fieldError = body?.error?.details
          ? Object.values(body.error.details).flat()[0]
          : undefined;
        setError(fieldError ?? body?.error?.message ?? "Registration failed");
        setPending(false);
        return;
      }

      // Account created — sign in immediately with the same credentials.
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setPending(false);
    }
  }

  return (
    <div className="card mx-auto w-full max-w-md p-8">
      <h1 className="text-2xl font-bold text-white">Create your account</h1>
      <p className="mt-1.5 text-sm text-zinc-400">
        Track orders and breeze through checkout next time.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-7 space-y-4">
        <div>
          <label htmlFor="register-name" className="label">
            Name
          </label>
          <input
            id="register-name"
            type="text"
            required
            minLength={2}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Ada Lovelace"
          />
        </div>
        <div>
          <label htmlFor="register-email" className="label">
            Email
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className="label">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full py-3">
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-amber-300 hover:text-amber-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}
