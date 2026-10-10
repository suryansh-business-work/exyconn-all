import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CmsDocumentStatus } from '@exyconn/shell/graphql/generated';
import { PageBuilderPage } from '../../../../../src/pages/cms/builder/PageBuilderPage';
import { queryResult, renderInSite } from '../cms-helpers';
import { pageBuilder, screenProps } from './page-builder.stubs';

const gql = vi.hoisted(() => ({
  page: vi.fn(),
  refetch: vi.fn(),
  saveDraft: vi.fn(),
  publish: vi.fn(),
  resources: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsPageQuery: (options: unknown) => gql.page(options),
  useSaveCmsPageDraftMutation: () => [gql.saveDraft],
  usePublishCmsPageMutation: () => [gql.publish],
}));
vi.mock('../../../../../src/pages/cms/builder/useBuilderResources', () => ({
  useBuilderResources: () => gql.resources(),
}));
vi.mock('../../../../../src/pages/cms/builder/BuilderScreen', async () => ({
  BuilderScreen: (await import('./page-builder.stubs')).BuilderScreenStub,
}));
vi.mock('../../../../../src/pages/cms/pages', async () =>
  (await import('./page-builder.stubs')).pagesModule(),
);

const RESOURCES = { components: [], fragments: [], canvasCss: '', canvasStyles: [], assets: [] };
const doc = {
  id: 'page-1',
  title: 'About us',
  path: '/about-us',
  status: CmsDocumentStatus.Draft,
  draft: { html: '<h1>About</h1>', css: 'h1{}', projectData: { pages: [] } },
};

const answer = (page: unknown, extra: { loading?: boolean; error?: Error } = {}) =>
  gql.page.mockReturnValue(
    queryResult(page === undefined ? undefined : { cmsPage: page }, {
      ...extra,
      refetch: gql.refetch,
    }),
  );

const renderAt = (route = '/website/s/main/pages/page-1/edit') =>
  renderInSite(<PageBuilderPage />, { route, path: '/website/s/:siteSlug/pages/:id?/edit' });

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('PageBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageBuilder.screen = null;
    pageBuilder.mounts = 0;
    gql.refetch.mockResolvedValue({});
    gql.saveDraft.mockResolvedValue({ data: {} });
    gql.publish.mockResolvedValue({ data: {} });
    pageBuilder.previewUrl.mockResolvedValue('https://exyconn.com/cms-preview?token=t');
    gql.resources.mockReturnValue({ resources: RESOURCES, loading: false, error: undefined });
    answer(doc);
  });

  it('opens the page draft in the builder, back to the pages list', () => {
    renderAt();

    expect(gql.page).toHaveBeenCalledWith({
      variables: { id: 'page-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(screenProps()).toMatchObject({
      title: 'About us',
      caption: 'Page /about-us',
      status: 'DRAFT',
      backPath: '/website/s/main/pages',
      initial: { html: '<h1>About</h1>', css: 'h1{}' },
      projectData: { pages: [] },
    });
  });

  it('saves, publishes and previews the page by id', async () => {
    renderAt();
    const draft = { html: '', css: '', projectData: {} };
    const saveFirst = vi.fn();

    await screenProps().saveDraft(draft);
    await screenProps().publish();
    screenProps().onPreview(saveFirst);
    await expect(screenProps().loadPreviewUrl()).resolves.toContain('cms-preview');

    expect(gql.saveDraft).toHaveBeenCalledWith({ variables: { id: 'page-1', draft } });
    expect(gql.publish).toHaveBeenCalledWith({ variables: { id: 'page-1' } });
    expect(pageBuilder.preview).toHaveBeenCalledWith('page-1', saveFirst);
    expect(pageBuilder.previewUrl).toHaveBeenCalledWith('page-1');
  });

  it('starts an empty canvas for a page with no draft', () => {
    answer({ ...doc, draft: null });
    renderAt();
    expect(screenProps()).toMatchObject({ initial: { html: '', css: '' }, projectData: undefined });
  });

  it('edits the page settings in a drawer and reloads the page when done', async () => {
    renderAt();
    await click('Open settings');

    expect(screen.getByRole('region', { name: 'Page settings' })).toBeInTheDocument();
    expect(screen.getByText('Settings of page-1 on site-1')).toBeInTheDocument();
    await click('Save settings');

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText('Settings of page-1 on site-1')).not.toBeInTheDocument(),
    );
  });

  it('closes the settings without reloading on cancel', async () => {
    renderAt();
    await click('Open settings');
    await click('Cancel settings');

    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Page settings' })).not.toBeInTheDocument(),
    );
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('closes the settings drawer on Escape', async () => {
    renderAt();
    await click('Open settings');
    await userEvent.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Page settings' })).not.toBeInTheDocument(),
    );
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('reports a reload that failed after the settings were saved', async () => {
    gql.refetch.mockRejectedValueOnce('offline');
    renderAt();
    await click('Open settings');
    await click('Save settings');

    expect(await screen.findByText('Could not reload the page')).toBeInTheDocument();
  });

  it('lists the revisions of this page and closes them', async () => {
    renderAt();
    expect(screen.getByText('Revisions closed')).toBeInTheDocument();

    await click('Open revisions');
    expect(screen.getByText('Revisions of page-1')).toBeInTheDocument();
    await click('Close revisions');
    expect(screen.getByText('Revisions closed')).toBeInTheDocument();
  });

  it('reopens the canvas on a restored revision once the page has reloaded', async () => {
    renderAt();
    expect(pageBuilder.mounts).toBe(1);

    await click('Open revisions');
    await click('Restore revision');

    expect(screen.getByText('Revisions closed')).toBeInTheDocument();
    await waitFor(() => expect(pageBuilder.mounts).toBe(2));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the canvas and reports a reload that failed after a restore', async () => {
    gql.refetch.mockRejectedValueOnce(new Error('Reload broke'));
    renderAt();
    await click('Open revisions');
    await click('Restore revision');

    expect(await screen.findByText('Reload broke')).toBeInTheDocument();
    expect(pageBuilder.mounts).toBe(1);
  });

  it('waits for the page and resources, and says why one could not open', () => {
    answer(undefined, { loading: true });
    const { unmount } = renderAt();
    expect(screen.getByRole('progressbar', { name: 'Opening the page' })).toBeInTheDocument();
    unmount();

    answer(undefined);
    gql.resources.mockReturnValue({ resources: null, loading: false, error: new Error('Nope') });
    renderAt();
    expect(screen.getByText('Could not open the page: Nope')).toBeInTheDocument();
  });

  it('waits for the resources even with the page loaded, and skips without an id', () => {
    gql.resources.mockReturnValue({ resources: null, loading: true, error: undefined });
    const { unmount } = renderAt();
    expect(screen.getByRole('progressbar', { name: 'Opening the page' })).toBeInTheDocument();
    unmount();

    answer(undefined, { error: new Error('Forbidden') });
    renderAt('/website/s/main/pages/edit');
    expect(gql.page).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true }));
    expect(screen.getByText('Could not open the page: Forbidden')).toBeInTheDocument();
  });
});
