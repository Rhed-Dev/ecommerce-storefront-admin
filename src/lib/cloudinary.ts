import { createHash } from "node:crypto";

/**
 * Cloudinary signed-upload helper.
 *
 * The browser uploads files directly to Cloudinary, but every upload must be
 * authorized by a signature computed here on the server. The API secret never
 * leaves the server — the client only ever sees the derived SHA-1 signature,
 * which is valid for a single parameter set and timestamp.
 *
 * Signature format (per Cloudinary docs): sort params alphabetically, join as
 * `key=value` pairs with `&`, append the API secret, SHA-1 the result.
 */
export function signUploadParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}
