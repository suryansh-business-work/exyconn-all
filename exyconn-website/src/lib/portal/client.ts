/**
 * Thin GraphQL client for the Exyconn portal.
 *
 * The portal is the single source of truth for all site content (blog, case studies,
 * careers, gigs, navigation). There is deliberately NO hardcoded fallback: if the
 * portal cannot be reached the error propagates, rather than silently serving stale
 * bundled content that would mask an editor's changes.
 */

function getPortalUrl(): string {
  const url =
    import.meta.env.PUBLIC_PORTAL_GRAPHQL_URL ?? process.env.PUBLIC_PORTAL_GRAPHQL_URL;

  if (!url) {
    throw new Error(
      'PUBLIC_PORTAL_GRAPHQL_URL is not set. The website reads all content from the portal — ' +
        'set it in .env (see .env.example).',
    );
  }

  return url;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/** Executes a GraphQL operation against the portal and returns its `data` payload. */
export async function portalRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(getPortalUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Portal request failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new Error(`Portal request failed: ${payload.errors.map((e) => e.message).join('; ')}`);
  }

  if (!payload.data) {
    throw new Error('Portal request returned no data.');
  }

  return payload.data;
}
