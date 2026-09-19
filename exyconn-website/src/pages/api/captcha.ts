import type { APIRoute } from "astro";
import { getCaptcha } from "../../lib/portal";

/**
 * A fresh security question for a form. Never cached: each question is good for one answer,
 * so a cached one would be refused for everyone after the first visitor.
 */
export const GET: APIRoute = async () => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  try {
    return new Response(JSON.stringify(await getCaptcha()), { status: 200, headers });
  } catch (err) {
    console.error("Could not load a captcha:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Could not load the security check" }), {
      status: 503,
      headers,
    });
  }
};
