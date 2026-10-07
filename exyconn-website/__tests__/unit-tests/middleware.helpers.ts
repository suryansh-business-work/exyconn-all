/**
 * Builders for calling the site middleware directly: a minimal Astro context (url, host
 * header, prerender flag, locals) and a `next` that records what it was asked to render.
 */
import type { APIContext, MiddlewareHandler, MiddlewareNext } from "astro";
import { vi } from "vitest";

export interface ContextOptions {
  /** The Host header; null for a request that sent none. */
  host?: string | null;
  isPrerendered?: boolean;
}

export interface TestContext {
  context: APIContext;
  locals: Record<string, unknown>;
  hostReads: () => number;
}

/** A context for `path` (pathname plus optional search) on `host`. */
export function contextFor(
  path: string,
  { host = "exyconn.com", isPrerendered = false }: ContextOptions = {}
): TestContext {
  let reads = 0;
  const locals: Record<string, unknown> = {};
  const request = {
    headers: {
      get: (name: string) => {
        reads += 1;
        return name === "host" ? host : null;
      },
    },
  };
  const context = {
    url: new URL(`https://exyconn.com${path}`),
    request,
    isPrerendered,
    locals,
  } as unknown as APIContext;
  return { context, locals, hostReads: () => reads };
}

/** A `next` resolving to a fresh response with `body` and `headers` on every call. */
export function nextReturning(body: string | null, headers: Record<string, string> = {}) {
  const fn = vi.fn<(payload?: unknown) => Promise<Response>>(
    async () => new Response(body, { status: 200, headers })
  );
  return { fn, next: fn as unknown as MiddlewareNext };
}

/** Runs the middleware and narrows its result to the Response it always returns. */
export async function run(
  handler: MiddlewareHandler,
  context: APIContext,
  next: MiddlewareNext
): Promise<Response> {
  const result = await handler(context, next);
  if (!(result instanceof Response)) {
    throw new TypeError("The middleware did not return a Response");
  }
  return result;
}

export const HTML = { "content-type": "text/html; charset=utf-8" };
