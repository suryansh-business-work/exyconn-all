import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageRevisionsDrawer } from '../../../../../src/pages/cms/pages';
import { renderWithProviders } from '../../../test-utils';
import { queryResult } from '../cms-helpers';

const spies = vi.hoisted(() => ({
  revisions: vi.fn(),
  restore: vi.fn(),
  onClose: vi.fn(),
  onRestored: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsPageRevisionsQuery: (options: unknown) => spies.revisions(options),
  useRestoreCmsPageRevisionMutation: () => [spies.restore],
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../cms-settings.mock')).settingsModuleMock(),
);

const REVISIONS = [
  {
    id: 'revision-3',
    version: 3,
    title: 'About us',
    publishedByName: 'Asha Rao',
    createdAt: '2026-03-04',
  },
  {
    id: 'revision-2',
    version: 2,
    title: 'About',
    publishedByName: 'Ravi K',
    createdAt: '2026-02-01',
  },
];

const answer = (rows: unknown[] | undefined, extra: { loading?: boolean; error?: Error } = {}) =>
  spies.revisions.mockReturnValue(queryResult(rows && { cmsPageRevisions: rows }, extra));

const renderDrawer = (pageId: string | null = 'page-1') =>
  renderWithProviders(
    <PageRevisionsDrawer pageId={pageId} onClose={spies.onClose} onRestored={spies.onRestored} />,
  );

async function restoreNewest(confirmWith: 'Restore' | 'Cancel') {
  const newest = screen.getByText('Version 3 · About us').closest('li') as HTMLElement;
  await userEvent.click(within(newest).getByRole('button', { name: 'Restore' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Restore version 3?')).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole('button', { name: confirmWith }));
}

describe('PageRevisionsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.restore.mockResolvedValue({ data: {} });
    answer(REVISIONS);
  });

  it('stays closed, and skips the query, without a page', () => {
    renderDrawer(null);

    expect(screen.queryByRole('region', { name: 'Revisions' })).not.toBeInTheDocument();
    expect(spies.revisions).toHaveBeenCalledWith({
      variables: { pageId: '' },
      skip: true,
      fetchPolicy: 'network-only',
    });
  });

  it('lists every published version, newest first, with who published it and when', () => {
    renderDrawer();

    expect(screen.getByRole('heading', { name: 'Revisions' })).toBeInTheDocument();
    expect(
      screen.getByText('A version is kept every time the page is published.'),
    ).toBeInTheDocument();
    expect(screen.getByText('at 2026-03-04 · Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Version 2 · About')).toBeInTheDocument();
    expect(spies.revisions).toHaveBeenCalledWith(expect.objectContaining({ skip: false }));
  });

  it('copies a version back into the draft once confirmed', async () => {
    renderDrawer();
    await restoreNewest('Restore');

    await waitFor(() => expect(spies.onRestored).toHaveBeenCalledTimes(1));
    expect(spies.restore).toHaveBeenCalledWith({ variables: { revisionId: 'revision-3' } });
    expect(await screen.findByText('Version 3 is now the draft')).toBeInTheDocument();
  });

  it('keeps the draft when the restore is cancelled', async () => {
    renderDrawer();
    await restoreNewest('Cancel');

    expect(spies.restore).not.toHaveBeenCalled();
    expect(spies.onRestored).not.toHaveBeenCalled();
  });

  it('says why a restore failed', async () => {
    spies.restore.mockRejectedValueOnce(new Error('Revision expired'));
    renderDrawer();
    await restoreNewest('Restore');

    expect(await screen.findByText('Revision expired')).toBeInTheDocument();
    expect(spies.onRestored).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure without a reason', async () => {
    spies.restore.mockRejectedValueOnce('offline');
    renderDrawer();
    await restoreNewest('Restore');

    expect(await screen.findByText('Could not restore the version')).toBeInTheDocument();
  });

  it('shows loading, a read error, and a page never published', () => {
    answer(undefined, { loading: true });
    const first = renderDrawer();
    expect(screen.getByRole('progressbar', { name: 'Loading revisions' })).toBeInTheDocument();
    expect(screen.queryByText('Not published yet')).not.toBeInTheDocument();
    first.unmount();

    answer(undefined, { error: new Error('Forbidden') });
    const second = renderDrawer();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(screen.queryByText('Not published yet')).not.toBeInTheDocument();
    second.unmount();

    answer([]);
    renderDrawer();
    expect(screen.getByText('Not published yet')).toBeInTheDocument();
  });
});
