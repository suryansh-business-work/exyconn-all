import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageSettingsEditor } from '../../../../../src/pages/cms/pages';
import { renderWithProviders } from '../../../test-utils';
import { queryResult } from '../cms-helpers';

const spies = vi.hoisted(() => ({
  page: vi.fn(),
  onDone: vi.fn(),
  onCancel: vi.fn(),
  onCreated: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsPageQuery: (options: unknown) => spies.page(options),
}));
vi.mock('../../../../../src/pages/website/forms/cms-page-settings', async () => ({
  CmsPageSettingsForm: (await import('../cms-form-stub')).CmsFormStub,
}));

const renderEditor = (pageId: string | null) =>
  renderWithProviders(
    <PageSettingsEditor
      siteId="site-1"
      pageId={pageId}
      onDone={spies.onDone}
      onCancel={spies.onCancel}
      onCreated={spies.onCreated}
    />,
  );

describe('PageSettingsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.page.mockReturnValue(queryResult({ cmsPage: { id: 'page-1', title: 'About us' } }));
  });

  it('creates a page from a blank form without reading anything', async () => {
    spies.page.mockReturnValue(queryResult(undefined));
    renderEditor(null);

    expect(spies.page).toHaveBeenCalledWith({
      variables: { id: '' },
      skip: true,
      fetchPolicy: 'network-only',
    });
    expect(screen.getByText('Blank form on site-1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Create in form' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    expect(spies.onCreated).toHaveBeenCalledWith('created-1');
    expect(spies.onCancel).toHaveBeenCalledTimes(1);
  });

  it('edits the full page once it is loaded', async () => {
    renderEditor('page-1');

    expect(spies.page).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'page-1' }, skip: false }),
    );
    expect(screen.getByText('Form for page-1 on site-1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create in form' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(spies.onDone).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner while the page loads', () => {
    spies.page.mockReturnValue(queryResult(undefined, { loading: true }));
    renderEditor('page-1');
    expect(screen.getByRole('progressbar', { name: 'Loading the page' })).toBeInTheDocument();
  });

  it('says why the page could not load, or that it is gone', () => {
    spies.page.mockReturnValue(queryResult(undefined, { error: new Error('Forbidden') }));
    const { unmount } = renderEditor('page-1');
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    unmount();

    spies.page.mockReturnValue(queryResult(undefined));
    renderEditor('page-1');
    expect(screen.getByText('That page no longer exists.')).toBeInTheDocument();
  });
});
