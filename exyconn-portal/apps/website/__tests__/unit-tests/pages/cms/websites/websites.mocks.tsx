import { vi } from 'vitest';

/**
 * The GraphQL doubles behind the websites page. Imports nothing from the app on purpose: the
 * `vi.mock` factories below load this file while the module graph is still being built.
 */
export const websitesGql = {
  sites: vi.fn(),
  refetch: vi.fn(),
  deleteSite: vi.fn(),
  setDefault: vi.fn(),
};

/** Answers the sites query with `sites` (or nothing yet, while loading). */
export function answerSites(sites: unknown[] | undefined, loading = false) {
  websitesGql.sites.mockReturnValue({
    data: sites && { cmsSites: sites },
    loading,
    refetch: websitesGql.refetch,
  });
}

/** `@exyconn/shell/graphql/generated` with the websites page's hooks doubled. */
export async function generatedModule(
  importOriginal: () => Promise<typeof import('@exyconn/shell/graphql/generated')>,
) {
  return {
    ...(await importOriginal()),
    useCmsSitesQuery: () => websitesGql.sites(),
    useDeleteCmsSiteMutation: () => [websitesGql.deleteSite],
    useSetDefaultCmsSiteMutation: () => [websitesGql.setDefault],
  };
}

/** The `../dns` module: the panel names the site whose DNS it would show. */
export function dnsModule() {
  return {
    DomainsDnsPanel: (props: Readonly<{ siteId: string }>) => <p>{`DNS of ${props.siteId}`}</p>,
  };
}
