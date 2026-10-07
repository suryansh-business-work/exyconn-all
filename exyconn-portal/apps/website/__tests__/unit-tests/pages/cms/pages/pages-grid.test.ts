import { describe, expect, it } from 'vitest';
import { CmsDocumentStatus, CmsPageKind } from '@exyconn/shell/graphql/generated';
import { PAGES_COLUMNS } from '../../../../../src/pages/cms/pages/pages-grid';
import { actionSpecs, cellStatus, cellText, columnIds, isActionHidden } from '../cms-grid-helpers';
import { pageRow } from './pages.fixtures';

describe('PAGES_COLUMNS', () => {
  it('shows path and title first, then kind, status, author, date and actions', () => {
    expect(columnIds(PAGES_COLUMNS)).toEqual([
      'path',
      'title',
      'kind',
      'status',
      'updatedByName',
      'updatedAt',
      'actions',
    ]);
  });

  it('writes each cell from the row', () => {
    const row = pageRow();

    expect(cellText(PAGES_COLUMNS, 'path', row)).toBe('/about-us');
    expect(cellText(PAGES_COLUMNS, 'title', row)).toBe('About us');
    expect(cellText(PAGES_COLUMNS, 'kind', row)).toBe('Page');
    expect(cellText(PAGES_COLUMNS, 'kind', pageRow({ kind: CmsPageKind.Template }))).toBe(
      'Template',
    );
    expect(cellStatus(PAGES_COLUMNS, 'status', row)).toBe('PUBLISHED');
    expect(cellText(PAGES_COLUMNS, 'updatedByName', row)).toBe('Asha Rao');
    expect(cellText(PAGES_COLUMNS, 'updatedByName', pageRow({ updatedByName: '' }))).toBe('—');
    expect(cellText(PAGES_COLUMNS, 'updatedAt', row, '2026-03-04')).toBe('on 2026-03-04');
  });

  it('writes nothing while a row is still loading', () => {
    expect(cellText(PAGES_COLUMNS, 'title', undefined)).toBe('');
  });

  it('offers every page action, ending with delete', () => {
    expect(actionSpecs(PAGES_COLUMNS).map((spec) => spec.key)).toEqual([
      'build',
      'settings',
      'preview',
      'publish',
      'unpublish',
      'duplicate',
      'revisions',
      'delete',
    ]);
  });

  it('offers publish only for unpublished work', () => {
    expect(isActionHidden(PAGES_COLUMNS, 'publish', pageRow())).toBe(true);
    expect(
      isActionHidden(PAGES_COLUMNS, 'publish', pageRow({ status: CmsDocumentStatus.Changed })),
    ).toBe(false);
  });

  it('offers unpublish only for a page that is live', () => {
    expect(isActionHidden(PAGES_COLUMNS, 'unpublish', pageRow())).toBe(false);
    expect(isActionHidden(PAGES_COLUMNS, 'unpublish', pageRow({ published: null }))).toBe(true);
    expect(isActionHidden(PAGES_COLUMNS, 'unpublish', pageRow({ published: undefined }))).toBe(
      true,
    );
    expect(isActionHidden(PAGES_COLUMNS, 'build', pageRow())).toBe(false);
  });
});
