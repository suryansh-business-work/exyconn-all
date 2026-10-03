/**
 * Thin GraphQL client for the Exyconn portal.
 *
 * The portal is the single source of truth for all site content (blog, case studies,
 * careers, gigs, navigation). There is deliberately NO hardcoded fallback content: this
 * client throws on any failure, and the read queries in queries.ts turn that into an empty
 * list (or null) plus a logged error, so a page shows its empty state instead of a 500 —
 * never stale bundled content that would mask an editor's changes.
 *
 * Local design work only: in `astro dev`, PORTAL_FIXTURES=<absolute path to a module
 * exporting `answerPortalQuery(query, variables)`> answers reads from that module (e.g.
 * tests/fixtures/portal.ts) so populated layouts can be built and screenshotted while the
 * portal is empty. Production builds compile this branch away (`import.meta.env.DEV`).
 */

function getPortalUrl(): string {
  const url = import.meta.env.PUBLIC_PORTAL_GRAPHQL_URL ?? process.env.PUBLIC_PORTAL_GRAPHQL_URL;

  if (!url) {
    throw new Error(
      "PUBLIC_PORTAL_GRAPHQL_URL is not set. The website reads all content from the portal — " +
        "set it in .env (see .env.example)."
    );
  }

  return url;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

/** The portal refused the operation. `codes` are its error codes, e.g. CAPTCHA_FAILED. */
export class PortalRequestError extends Error {
  constructor(
    message: string,
    readonly codes: readonly string[]
  ) {
    super(message);
    this.name = "PortalRequestError";
  }
}

interface FixtureModule {
  answerPortalQuery: (query: string, variables: Record<string, unknown>) => unknown;
}

/** Executes a GraphQL operation against the portal and returns its `data` payload. */
export async function portalRequest<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const fixtures = import.meta.env.DEV ? process.env.PORTAL_FIXTURES : undefined;
  if (fixtures) {
    const module = (await import(/* @vite-ignore */ fixtures)) as FixtureModule;
    return module.answerPortalQuery(query, variables) as T;
  }

  const response = await fetch(getPortalUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Portal request failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new PortalRequestError(
      `Portal request failed: ${payload.errors.map((e) => e.message).join("; ")}`,
      payload.errors.map((e) => e.extensions?.code ?? "")
    );
  }

  if (!payload.data) {
    throw new Error("Portal request returned no data.");
  }

  return payload.data;
}
