/**
 * A stand-in for the PORTAL_FIXTURES module `astro dev` can answer portal reads from: it
 * echoes what it was asked, so a test can see the client handed the operation over.
 */
export function answerPortalQuery(query: string, variables: Record<string, unknown>): unknown {
  return { echoed: { query, variables } };
}
