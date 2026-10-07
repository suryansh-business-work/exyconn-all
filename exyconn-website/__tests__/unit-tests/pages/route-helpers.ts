/**
 * Builders for calling the site's API routes and endpoints directly: a request, the slice of
 * Astro's context the routes read (request and url), and the JSON answer taken apart.
 */
import type { APIContext } from "astro";

/** One visitor's address, as nginx appends it to X-Forwarded-For. */
export const VISITOR = "203.0.113.5";

/** A POST to `path` from VISITOR; a string body is sent as written (e.g. broken JSON). */
export function postRequest(
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
): Request {
  return new Request(`https://exyconn.com${path}`, {
    method: "POST",
    headers: { "x-forwarded-for": VISITOR, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** The context an Astro route is called with, as far as these routes read it. */
export function routeContext(request: Request): APIContext {
  return { request, url: new URL(request.url) } as unknown as APIContext;
}

/** Status and parsed JSON body of a route's answer. */
export async function readJson(
  response: Response
): Promise<{ status: number; body: Record<string, unknown> }> {
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}
