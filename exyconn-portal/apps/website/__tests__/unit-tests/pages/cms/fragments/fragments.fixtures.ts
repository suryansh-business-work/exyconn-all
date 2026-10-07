import { CmsDocumentStatus, CmsFragmentKind } from '@exyconn/shell/graphql/generated';
import type { CmsFragmentRow } from '../../../../../src/pages/website/forms/cms-fragment';

/** A fragment as the site's fragments list returns it. */
export function fragmentRow(overrides: Partial<CmsFragmentRow> = {}): CmsFragmentRow {
  return {
    id: 'fragment-1',
    siteId: 'site-1',
    name: 'Main header',
    kind: CmsFragmentKind.Header,
    status: CmsDocumentStatus.Published,
    updatedByName: 'Asha Rao',
    updatedAt: '2026-03-04',
    published: { publishedAt: '2026-03-04' },
    ...overrides,
  };
}

/** A header (published), a footer with a draft and a section with unpublished edits. */
export const FRAGMENTS: CmsFragmentRow[] = [
  fragmentRow(),
  fragmentRow({
    id: 'fragment-2',
    name: 'Site footer',
    kind: CmsFragmentKind.Footer,
    status: CmsDocumentStatus.Draft,
    updatedByName: '',
    published: null,
  }),
  fragmentRow({
    id: 'fragment-3',
    name: 'Pricing band',
    kind: CmsFragmentKind.Section,
    status: CmsDocumentStatus.Changed,
  }),
];
