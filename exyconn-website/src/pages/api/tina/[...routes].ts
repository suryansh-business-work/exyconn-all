import type { APIRoute } from "astro";
import type { ServerResponse } from "node:http";
import { tinaBackend } from "../../../lib/tina/backend";
import { NodeResponse, toNodeRequest } from "../../../lib/tina/node-shim";
import { ensureIndexed } from "../../../lib/tina/sync";

/** TinaCMS backend (GraphQL + Auth.js routes) for the editor at /admin, hosted on this server. */
export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
  try {
    await ensureIndexed();
  } catch (error) {
    console.error("TinaCMS: indexing the content into the database failed", error);
    return Response.json(
      { error: "The TinaCMS content index is unavailable; check the website server logs." },
      { status: 503 }
    );
  }
  const res = new NodeResponse();
  await tinaBackend(await toNodeRequest(request), res as unknown as ServerResponse);
  return res.toResponse();
};
