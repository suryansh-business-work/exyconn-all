import {
  CmsFragmentKind,
  CmsPageKind,
  useCmsDesignSystemsQuery,
  useCmsFragmentsQuery,
  useCmsPagesQuery,
} from '@exyconn/shell/graphql/generated';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';

const NONE: SelectOption = { value: '', label: 'None' };
/** The 404 page is one of the site's pages; a site has far fewer than this. */
const PAGE_OPTIONS_LIMIT = 200;

/**
 * What a site's settings can point at — its fragments, design systems and pages. A site not
 * created yet has none, so the selects offer only "None".
 */
export function useSiteOptions(siteId: string | undefined) {
  const skip = !siteId;
  const fragments = useCmsFragmentsQuery({ variables: { siteId: siteId ?? '' }, skip });
  const designs = useCmsDesignSystemsQuery({ variables: { siteId: siteId ?? '' }, skip });
  const pages = useCmsPagesQuery({
    variables: {
      siteId: siteId ?? '',
      input: { page: 0, pageSize: PAGE_OPTIONS_LIMIT, kind: CmsPageKind.Page },
    },
    skip,
  });

  const fragmentOptions = (kind: CmsFragmentKind): SelectOption[] => [
    NONE,
    ...(fragments.data?.cmsFragments ?? [])
      .filter((fragment) => fragment.kind === kind)
      .map((fragment) => ({ value: fragment.id, label: fragment.name })),
  ];

  return {
    headers: fragmentOptions(CmsFragmentKind.Header),
    footers: fragmentOptions(CmsFragmentKind.Footer),
    designSystems: [
      NONE,
      ...(designs.data?.cmsDesignSystems ?? []).map((design) => ({
        value: design.id,
        label: design.name,
      })),
    ],
    pages: [
      NONE,
      ...(pages.data?.cmsPages.rows ?? []).map((page) => ({
        value: page.id,
        label: `${page.title} (${page.path})`,
      })),
    ],
  };
}
