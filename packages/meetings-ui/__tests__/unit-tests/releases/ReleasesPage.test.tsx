import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaReleaseStatus,
  useMaReleaseDownloadLinkMutation,
  useMaReleasesQuery,
  useMaSetReleaseStatusMutation,
} from '@exyconn/shell/graphql/generated';
import { ReleasesPage } from '../../../src/releases/ReleasesPage';
import { makeRelease } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders, stubLocationAssign } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaReleasesQuery: vi.fn(),
  useMaSetReleaseStatusMutation: vi.fn(),
  useMaReleaseDownloadLinkMutation: vi.fn(),
}));

const setStatus = vi.fn();
const link = vi.fn();

beforeEach(() => {
  setStatus.mockReset().mockResolvedValue({ data: {} });
  link.mockReset().mockResolvedValue({
    data: {
      maReleaseDownloadLink: {
        url: 'https://files.example.com/r.zip',
        expiresAt: '',
        fileName: 'r.zip',
        sha256: 'ab',
      },
    },
  });
  vi.mocked(useMaSetReleaseStatusMutation).mockReturnValue(mutationTuple(setStatus) as never);
  vi.mocked(useMaReleaseDownloadLinkMutation).mockReturnValue(mutationTuple(link) as never);
  vi.mocked(useMaReleasesQuery).mockReturnValue(
    queryResult({
      maReleases: [
        makeRelease({ storeUrl: 'https://chromewebstore.google.com/detail/item' }),
        makeRelease({
          id: 'release-0',
          version: '1.3.0',
          status: MaReleaseStatus.Deprecated,
          downloadable: false,
          publisherName: '',
          buildRunUrl: '',
        }),
      ],
    }) as never,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const rowOf = (version: string) => screen.getByText(version).closest('tr') as HTMLElement;

describe('ReleasesPage', () => {
  it('lists every build CI registered, with every field', () => {
    renderWithProviders(<ReleasesPage />);
    expect(screen.getByText(/registered by CI/)).toBeInTheDocument();
    const row = rowOf('1.4.0');
    expect(within(row).getByText('a1b2c3d4e5f6')).toBeInTheDocument();
    expect(within(row).getByText('2.0 KB')).toBeInTheDocument();
    expect(within(row).getByText('ffffffffffff')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'Store listing' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(within(row).getByRole('link', { name: 'Open build log' })).toHaveAttribute(
      'href',
      'https://github.com/example/actions/runs/1',
    );
    const old = rowOf('1.3.0');
    expect(within(old).getAllByText('—')).toHaveLength(3);
    expect(
      within(old).queryByRole('button', { name: 'Download this build' }),
    ).not.toBeInTheDocument();
    expect(
      within(old).queryByRole('button', { name: 'Deprecate this build' }),
    ).not.toBeInTheDocument();
  });

  it('downloads a build', async () => {
    const assign = stubLocationAssign();
    renderWithProviders(<ReleasesPage />);
    await userEvent.click(
      within(rowOf('1.4.0')).getByRole('button', { name: 'Download this build' }),
    );
    expect(link).toHaveBeenCalledWith({ variables: { id: 'release-1' } });
    expect(assign).toHaveBeenCalledWith('https://files.example.com/r.zip');
  });

  it('moves a build to another status with a note and a store listing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleasesPage />);
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Change status' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Change status' }));
    expect(await within(dialog).findByText('Say why the status is changing')).toBeInTheDocument();

    const storeUrl = within(dialog).getByRole('textbox', {
      name: 'Chrome Web Store address (optional)',
    });
    await user.clear(storeUrl);
    await user.type(storeUrl, 'chromewebstore');
    await user.type(within(dialog).getByRole('textbox', { name: 'Note' }), 'Approved by Google');
    await user.click(within(dialog).getByRole('button', { name: 'Change status' }));
    expect(
      await within(dialog).findByText('Enter the full store address, starting https://'),
    ).toBeInTheDocument();

    await user.clear(storeUrl);
    await user.type(storeUrl, 'https://chromewebstore.google.com/detail/x');
    await user.click(within(dialog).getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'In Review' }));
    await user.click(within(dialog).getByRole('button', { name: 'Change status' }));
    expect(setStatus).toHaveBeenCalledWith({
      variables: {
        id: 'release-1',
        input: {
          status: MaReleaseStatus.InReview,
          note: 'Approved by Google',
          storeItemId: null,
          storeUrl: 'https://chromewebstore.google.com/detail/x',
        },
      },
    });
    expect(await screen.findByText('Release 1.4.0 updated')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the status form open when the server refuses, and cancels', async () => {
    const user = userEvent.setup();
    setStatus.mockRejectedValue(new Error('Release managers only'));
    renderWithProviders(<ReleasesPage />);
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Change status' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: 'Note' }), 'Ship it');
    await user.click(within(dialog).getByRole('button', { name: 'Change status' }));
    expect(await screen.findByText('Release managers only')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Change status' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Close' }),
    );
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the status history of a build', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleasesPage />);
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Status history' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Version 1.4.0 history')).toBeInTheDocument();
    expect(within(dialog).getByText(/^Asha Rao · .* — Go$/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('deprecates a build only after a destructive confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleasesPage />);
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Deprecate this build' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    expect(setStatus).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Deprecate this build' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Deprecate version 1.4.0?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Deprecate' }));
    expect(setStatus).toHaveBeenCalledWith({
      variables: {
        id: 'release-1',
        input: { status: MaReleaseStatus.Deprecated, note: 'Deprecated from the releases page' },
      },
    });
    expect(await screen.findByText('Release 1.4.0 deprecated')).toBeInTheDocument();
  });

  it('shows the releases loading', () => {
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderWithProviders(<ReleasesPage />);
    expect(screen.queryByText('No release available yet.')).not.toBeInTheDocument();
  });

  it('shows the releases failing with Retry, and none yet', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Releases down'), refetch }) as never,
    );
    const first = renderWithProviders(<ReleasesPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
    first.unmount();
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult({ maReleases: [] }, { refetch }) as never,
    );
    renderWithProviders(<ReleasesPage />);
    expect(screen.getByText('No release available yet.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
  });
});
