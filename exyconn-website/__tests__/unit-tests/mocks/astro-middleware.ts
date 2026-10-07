/**
 * Stand-in for Astro's `astro:middleware` virtual module, which only exists inside the Astro
 * vite pipeline. `defineMiddleware` returns the handler unchanged, exactly as Astro's does, so
 * a test calls `onRequest(context, next)` directly.
 */
import type { MiddlewareHandler } from "astro";

export function defineMiddleware(handler: MiddlewareHandler): MiddlewareHandler {
  return handler;
}
