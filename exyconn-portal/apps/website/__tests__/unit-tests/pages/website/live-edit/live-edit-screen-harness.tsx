import { vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import type { LiveDesign } from '@exyconn/live-editor';
import { LiveEditScreen } from '../../../../../src/pages/website/live-edit/LiveEditScreen';
import { renderWithProviders } from '../../../test-utils';

export const EDIT_ROUTE = '/website/s/main/blog/post-1/live-edit';
export const LIST_ROUTE = '/website/s/main/blog';
export const PAGE_URL = 'https://exyconn.com/blog/why-agents-fail';
export const INITIAL: LiveDesign = { html: '<p>Original</p>', css: '' };

type SaveDesign = (design: LiveDesign) => Promise<unknown>;

/** Opens the live-edit screen for one post, with the blog list it returns to beside it. */
export function renderLiveEditScreen(
  onSave = vi.fn<SaveDesign>(() => Promise.resolve({ data: { updated: true } })),
) {
  renderWithProviders(
    <Routes>
      <Route
        path={EDIT_ROUTE}
        element={
          <LiveEditScreen
            title="Why agents fail"
            pageUrl={PAGE_URL}
            backPath={LIST_ROUTE}
            folder="website/blog"
            initial={INITIAL}
            onSave={onSave}
          />
        }
      />
      <Route path={LIST_ROUTE} element={<p>Blog list</p>} />
    </Routes>,
    { route: EDIT_ROUTE },
  );
  return onSave;
}
