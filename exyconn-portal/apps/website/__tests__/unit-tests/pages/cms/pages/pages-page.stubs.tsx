import { vi } from 'vitest';
import type { PageFilters } from '../../../../../src/pages/cms/pages/useCmsPagesFetcher';

/** The doubles the pages page is handed, and what its fetcher was last built with. */
export const pagesPage = {
  publish: vi.fn(),
  unpublish: vi.fn(),
  preview: vi.fn(),
  fetchRows: vi.fn(),
  fetcherArgs: null as { siteId: string; filters: PageFilters } | null,
};

/** Stands in for the settings editor: names the page (or a new one) and its callbacks. */
export function SettingsEditorStub(
  props: Readonly<{
    siteId: string;
    pageId: string | null;
    onCancel: () => void;
    onDone: () => void;
    onCreated?: (id: string) => void;
  }>,
) {
  return (
    <div>
      <p>{`Settings of ${props.pageId ?? 'a new page'} on ${props.siteId}`}</p>
      <button type="button" onClick={props.onCancel}>
        Cancel settings
      </button>
      <button type="button" onClick={props.onDone}>
        Save settings
      </button>
      <button type="button" onClick={() => props.onCreated?.('page-new')}>
        Create page
      </button>
    </div>
  );
}

/** Stands in for the duplicate dialog: names the source page and offers close and done. */
export function DuplicateFormStub(
  props: Readonly<{ source: { path: string } | null; onClose: () => void; onDone: () => void }>,
) {
  if (!props.source) return null;
  return (
    <div>
      <p>{`Duplicate ${props.source.path}`}</p>
      <button type="button" onClick={props.onClose}>
        Close duplicate
      </button>
      <button type="button" onClick={props.onDone}>
        Finish duplicate
      </button>
    </div>
  );
}

/** Stands in for the revisions drawer: names the page it lists and offers close. */
export function RevisionsDrawerStub(
  props: Readonly<{ pageId: string | null; onClose: () => void; onRestored: () => void }>,
) {
  if (!props.pageId) return null;
  return (
    <div>
      <p>{`Revisions of ${props.pageId}`}</p>
      <button type="button" onClick={props.onClose}>
        Close revisions
      </button>
      <button type="button" onClick={props.onRestored}>
        Restore revision
      </button>
    </div>
  );
}

/** Stands in for the pages fetcher: records its site and filters. */
export function useCmsPagesFetcherStub(siteId: string, filters: PageFilters) {
  pagesPage.fetcherArgs = { siteId, filters };
  return pagesPage.fetchRows;
}
