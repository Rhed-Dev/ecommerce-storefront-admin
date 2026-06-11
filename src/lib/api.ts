import { NextResponse } from "next/server";
import type { ZodTypeAny, z } from "zod";

/**
 * Shared API response helpers. Every error leaving the API has the shape
 * `{ error: { message, details? } }` with a meaningful HTTP status code.
 */

export interface ApiErrorBody {
  error: {
    message: string;
    details?: unknown;
  };
}

export function jsonError(status: number, message: string, details?: unknown): NextResponse {
  const body: ApiErrorBody = { error: { message, ...(details !== undefined ? { details } : {}) } };
  return NextResponse.json(body, { status });
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Parse + validate a JSON request body. Returns a ready 400 response on failure. */
export async function parseJsonBody<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: jsonError(400, "Request body must be valid JSON") };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(400, "Validation failed", parsed.error.flatten().fieldErrors),
    };
  }
  return { ok: true, data: parsed.data };
}
