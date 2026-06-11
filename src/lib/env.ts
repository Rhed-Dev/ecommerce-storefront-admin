/**
 * Environment access helpers.
 *
 * Nothing in this module (or anywhere else in the app) reads required env vars
 * at import time. Validation happens at the point of use so that `next build`
 * succeeds with no .env present — missing configuration surfaces as a clear
 * runtime error on the exact request that needed it.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env and fill it in (see README → Getting started).`,
    );
  }
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

/** Base URL used for Stripe redirect URLs and absolute links. */
export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** True when both Google OAuth env vars are configured. */
export function googleAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** True when Cloudinary upload credentials are configured. */
export function cloudinaryEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}
