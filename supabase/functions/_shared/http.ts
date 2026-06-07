import { corsHeaders } from "./cors.ts";

/** JSON success response with CORS headers. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** JSON error response. */
export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

/** Standard CORS preflight response. */
export function preflight(): Response {
  return new Response(null, { headers: corsHeaders });
}

/** An error carrying an HTTP status, thrown by handlers and caught centrally. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Wrap a handler with CORS preflight handling and uniform error mapping, so
 * each function body can just `throw new HttpError(...)` or return JSON.
 */
export function handle(
  fn: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return preflight();
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof HttpError) return error(e.message, e.status);
      console.error("Unhandled function error:", e);
      const message = e instanceof Error ? e.message : "Internal error";
      return error(message, 500);
    }
  };
}
