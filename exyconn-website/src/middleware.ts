import { defineMiddleware } from "astro:middleware";

const APEX_HOST = "exyconn.com";

/**
 * Site-wide middleware:
 *  - 301 redirect www.exyconn.com -> exyconn.com (kills 72 duplicate title/content/meta-description issues)
 *  - 301 redirect any path with a trailing slash (except "/") -> non-trailing-slash (matches astro.config trailingSlash:'never')
 *  - Strict-Transport-Security (HSTS) + baseline security headers on every response
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;
  const host = context.request.headers.get("host") || "";

  // 1. Force apex (no www) on production hostnames only
  const lowerHost = host.toLowerCase();
  if (lowerHost === `www.${APEX_HOST}`) {
    const target = `https://${APEX_HOST}${url.pathname}${url.search}`;
    return new Response(null, {
      status: 301,
      headers: { Location: target, "Cache-Control": "public, max-age=3600" },
    });
  }

  // 2. Force non-trailing-slash canonical (skip "/" and asset paths with file extensions)
  if (
    url.pathname.length > 1 &&
    url.pathname.endsWith("/") &&
    !/\.[a-zA-Z0-9]+\/$/.test(url.pathname)
  ) {
    const target = url.pathname.replace(/\/+$/, "") + url.search;
    return new Response(null, {
      status: 301,
      headers: { Location: target, "Cache-Control": "public, max-age=3600" },
    });
  }

  const response = await next();

  // 3. Apply security headers to all HTML responses (don't mutate redirects/streams unnecessarily)
  const contentType = response.headers.get("content-type") || "";
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  if (contentType.includes("text/html")) {
    response.headers.set("X-DNS-Prefetch-Control", "on");
  }

  return response;
});
