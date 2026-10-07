import { CmsDocumentStatus, CmsPageKind, CmsPageLayout } from '@exyconn/shell/graphql/generated';
import type { CmsPageRow } from '../../../../../src/pages/cms/pages/pages-grid';

/** A page as the site's pages list returns it. */
export function pageRow(overrides: Partial<CmsPageRow> = {}): CmsPageRow {
  return {
    id: 'page-1',
    siteId: 'site-1',
    path: '/about-us',
    kind: CmsPageKind.Page,
    title: 'About us',
    layout: CmsPageLayout.Default,
    status: CmsDocumentStatus.Published,
    updatedByName: 'Asha Rao',
    updatedAt: '2026-03-04',
    seo: { noindex: false },
    published: { publishedAt: '2026-03-04' },
    ...overrides,
  };
}
