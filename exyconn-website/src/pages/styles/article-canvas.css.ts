import type { APIRoute } from "astro";
import canvasCss from "../../styles/article-canvas.css?inline";

/**
 * The article stylesheet at a stable address, for the portal's live editor: its canvas
 * loads this so a body is designed against the rules the detail pages render it with.
 * Built from the same source file as the pages' own CSS, so the two cannot drift.
 */
export const GET: APIRoute = () =>
  new Response(canvasCss, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
