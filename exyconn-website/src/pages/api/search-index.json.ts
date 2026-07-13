import type { APIRoute } from "astro";
import { getNavLinks } from "../../lib/portal";

/**
 * Lightweight search index served as JSON for the global search modal.
 * Rendered per request so portal content edits appear without a redeploy.
 */
export const prerender = false;

export const GET: APIRoute = async () => {
  const navLinks = await getNavLinks();

  const items = navLinks.map((l) => ({
    t: l.label,
    u: l.href,
    d: l.description,
    c: l.category,
    k: l.keywords ?? "",
  }));

  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
};
