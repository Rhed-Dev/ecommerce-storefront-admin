import { requireAdminApi } from "@/lib/guard";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { signUploadSchema } from "@/lib/validators";
import { signUploadParams } from "@/lib/cloudinary";
import { requireEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Issues a one-time Cloudinary upload signature.
 *
 * The browser uploads the file straight to Cloudinary (no proxying through
 * this server), but only with a signature minted here for an authenticated
 * admin. The API secret never leaves the server.
 */
export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = await parseJsonBody(req, signUploadSchema);
  if (!parsed.ok) return parsed.response;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  if (!cloudName || !apiKey || !process.env.CLOUDINARY_API_SECRET) {
    return jsonError(503, "Cloudinary is not configured. Set the CLOUDINARY_* env vars.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: parsed.data.folder, timestamp };
  const signature = signUploadParams(params, requireEnv("CLOUDINARY_API_SECRET"));

  return jsonOk({
    cloudName,
    apiKey,
    timestamp,
    folder: parsed.data.folder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  });
}
