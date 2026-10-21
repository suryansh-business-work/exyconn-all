import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useMaDisconnectGoogleMutation,
  useMaGoogleConnectionQuery,
  useMaLatestReleaseQuery,
  useMaMyExtensionSessionsQuery,
  useMaReleaseDownloadLinkMutation,
  useMaReleaseOverviewQuery,
  useMaReleasesQuery,
  useMaRevokeExtensionSessionMutation,
  useMaStartGoogleConnectMutation,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { ExtensionPage } from '../../../src/extension/ExtensionPage';
import { STARTED, makeRelease } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders, stubLocationAssign } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaLatestReleaseQuery: vi.fn(),
  useMaReleasesQuery: vi.fn(),
  useMaReleaseDownloadLinkMutation: vi.fn(),
  useMaMyExtensionSessionsQuery: vi.fn(),
  useMaRevokeExtensionSessionMutation: vi.fn(),
  useMaGoogleConnectionQuery: vi.fn(),
  useMaStartGoogleConnectMutation: vi.fn(),
  useMaDisconnectGoogleMutation: vi.fn(),
  useMaReleaseOverviewQuery: vi.fn(),
}));
vi.mock('@exyconn/shell/utils/clipboard', () => ({ copyToClipboard: vi.fn() }));

const run = { link: vi.fn(), revoke: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
const latestRefetch = vi.fn();
const SESSION = {
  id: 's1',
  deviceLabel: 'Chrome on macOS',
  extensionVersion: '1.4.0',
  createdAt: STARTED,
  lastSeenAt: null,
  expiresAt: '2026-11-20T09:00:00.000Z',
  revokedAt: null,
  current: true,
};
const CONNECTION = {
  configured: true,
  connected: false,
  email: null,
  connectedAt: null,
  lastError: '',
};

function connection(patch: Partial<typeof CONNECTION> | Record<string, unknown> = {}) {
  vi.mocked(useMaGoogleConnectionQuery).mockReturnValue(
    queryResult({ maGoogleConnection: { ...CONNECTION, ...patch } }) as never,
  );
}

beforeEach(() => {
  for (const fn of Object.values(run)) {
    fn.mockReset().mockResolvedValue({ data: {} });
  }
  latestRefetch
    .mockReset()
    .mockResolvedValue({ data: { maLatestRelease: makeRelease({ version: '1.5.0' }) } });
  vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
    queryResult({ maLatestRelease: makeRelease() }, { refetch: latestRefetch }) as never,
  );
  vi.mocked(useMaReleasesQuery).mockReturnValue(
    queryResult({
      maReleases: [makeRelease(), makeRelease({ id: 'r0', version: '1.3.0', releaseNotes: '' })],
    }) as never,
  );
  vi.mocked(useMaReleaseDownloadLinkMutation).mockReturnValue(mutationTuple(run.link) as never);
  vi.mocked(useMaMyExtensionSessionsQuery).mockReturnValue(
    queryResult({
      maMyExtensionSessions: [
        SESSION,
        {
          ...SESSION,
          id: 's2',
          deviceLabel: 'Old laptop',
          lastSeenAt: STARTED,
          revokedAt: STARTED,
        },
      ],
    }) as never,
  );
  vi.mocked(useMaRevokeExtensionSessionMutation).mockReturnValue(
    mutationTuple(run.revoke) as never,
  );
  vi.mocked(useMaStartGoogleConnectMutation).mockReturnValue(mutationTuple(run.connect) as never);
  vi.mocked(useMaDisconnectGoogleMutation).mockReturnValue(mutationTuple(run.disconnect) as never);
  connection();
  vi.mocked(useMaReleaseOverviewQuery).mockReturnValue(
    queryResult({
      maReleaseOverview: { releaseManager: false, registered: 0, awaitingApproval: 0 },
    }) as never,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ExtensionPage — the release', () => {
  it('describes the newest release and keeps the store button off until a listing exists', () => {
    renderWithProviders(<ExtensionPage />);
    expect(
      screen.getByRole('heading', { name: 'Google Meet AI Assistant', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Current version').nextElementSibling).toHaveTextContent('1.4.0');
    expect(screen.getByText('Chrome 120 or later')).toBeInTheDocument();
    expect(screen.getByText('f'.repeat(64))).toBeInTheDocument();
    expect(screen.queryByText('Install from Chrome Web Store')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download extension (.zip)' })).toBeEnabled();
  });

  it('links the store button to the real listing once there is one', () => {
    const storeUrl = 'https://chromewebstore.google.com/detail/item';
    vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
      queryResult({ maLatestRelease: makeRelease({ storeUrl }) }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByRole('link', { name: 'Install from Chrome Web Store' })).toHaveAttribute(
      'href',
      storeUrl,
    );
  });

  it('keeps the download off for a build that is not downloadable', () => {
    vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
      queryResult({ maLatestRelease: makeRelease({ downloadable: false }) }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByRole('button', { name: 'Download extension (.zip)' })).toBeDisabled();
  });

  it('downloads the internal ZIP through a short-lived link and gives its checksum', async () => {
    const assign = stubLocationAssign();
    run.link.mockResolvedValue({
      data: {
        maReleaseDownloadLink: {
          url: 'https://files.example.com/x.zip',
          expiresAt: STARTED,
          fileName: 'x.zip',
          sha256: 'abc',
        },
      },
    });
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Download extension (.zip)' }));
    expect(run.link).toHaveBeenCalledWith({ variables: { id: 'release-1' } });
    expect(assign).toHaveBeenCalledWith('https://files.example.com/x.zip');
    expect(await screen.findByText('Downloading x.zip. Its SHA-256 is abc')).toBeInTheDocument();
  });

  it('says why a download could not start, and stays put without a link', async () => {
    const assign = stubLocationAssign();
    run.link.mockRejectedValueOnce(new Error('Release withdrawn'));
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Download extension (.zip)' }));
    expect(await screen.findByText('Release withdrawn')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Download extension (.zip)' }));
    expect(assign).not.toHaveBeenCalled();
  });

  it('lists the install steps in order, with the extensions address as text', () => {
    renderWithProviders(<ExtensionPage />);
    const steps = screen.getAllByRole('listitem');
    expect(steps).toHaveLength(5);
    expect(steps[0]).toHaveTextContent(/^Unzip the downloaded file/);
    expect(steps[1]).toHaveTextContent('In Chrome, open chrome://extensions');
    expect(steps[3]).toHaveTextContent('Click "Load unpacked"');
    expect(screen.queryByRole('link', { name: /chrome:\/\// })).not.toBeInTheDocument();
    expect(screen.getByText(/^To update: download the new file/)).toHaveTextContent(
      'reload arrow on the extension in chrome://extensions',
    );
  });

  it('copies the extensions address, and says when the browser refuses', async () => {
    const user = userEvent.setup();
    vi.mocked(copyToClipboard).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    renderWithProviders(<ExtensionPage />);
    const copy = screen.getByRole('button', { name: 'Copy chrome://extensions' });
    await user.click(copy);
    expect(copyToClipboard).toHaveBeenCalledWith('chrome://extensions');
    expect(await screen.findByText('Address copied')).toBeInTheDocument();
    await user.click(copy);
    expect(
      await screen.findByText('Could not copy the address. Type it into the address bar instead.'),
    ).toBeInTheDocument();
  });

  it('shows the changelog of every release', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExtensionPage />);
    expect(vi.mocked(useMaReleasesQuery).mock.lastCall?.[0]).toMatchObject({ skip: true });
    await user.click(screen.getByRole('button', { name: 'View changelog' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Faster transcripts')).toBeInTheDocument();
    expect(within(dialog).getByText('No release notes.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
  });

  it('shows the changelog empty, loading and failing', async () => {
    const user = userEvent.setup();
    vi.mocked(useMaReleasesQuery).mockReturnValue(queryResult({ maReleases: [] }) as never);
    const first = renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'View changelog' }));
    expect(await screen.findByText('No release available yet.')).toBeInTheDocument();
    first.unmount();
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const second = renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'View changelog' }));
    expect(screen.queryByText('Faster transcripts')).not.toBeInTheDocument();
    second.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Changelog down'), refetch }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'View changelog' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Retry' }),
    );
    expect(refetch).toHaveBeenCalled();
  });

  it('checks for updates and says what it found', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'Check for updates' }));
    expect(await screen.findByText('The newest release is version 1.5.0')).toBeInTheDocument();
    latestRefetch.mockResolvedValueOnce({ data: { maLatestRelease: null } });
    await user.click(screen.getByRole('button', { name: 'Check for updates' }));
    expect(await screen.findByText('No release available yet')).toBeInTheDocument();
  });

  it('logs a failed update check, leaving the error to the query', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    latestRefetch.mockRejectedValueOnce(new Error('offline'));
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Check for updates' }));
    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Checking for extension updates failed', expect.any(Error)),
    );
  });

  it('says when no release is available yet, and shows loading and errors', async () => {
    vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
      queryResult({ maLatestRelease: null }) as never,
    );
    const first = renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('The extension is not available yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Releases' })).not.toBeInTheDocument();
    first.unmount();
    vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const second = renderWithProviders(<ExtensionPage />);
    expect(screen.queryByText('Current version')).not.toBeInTheDocument();
    second.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Releases down'), refetch }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    const alert = screen.getByText('Releases down').closest('[role="alert"]') as HTMLElement;
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});

describe('ExtensionPage — signed-in browsers', () => {
  it('lists each browser and signs one out after a destructive confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
    const signOut = screen.getAllByRole('button', { name: 'Sign out this browser' });
    expect(signOut).toHaveLength(1);
    await user.click(signOut[0]);
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        'The extension on Chrome on macOS stops working until it is signed in again.',
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Sign out' }));
    expect(run.revoke).toHaveBeenCalledWith({
      variables: { id: 's1' },
      refetchQueries: ['MaMyExtensionSessions'],
    });
    expect(await screen.findByText('Extension signed out')).toBeInTheDocument();
  });

  it('does nothing when signing out is cancelled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'Sign out this browser' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    expect(run.revoke).not.toHaveBeenCalled();
  });

  it('shows the sessions loading', () => {
    vi.mocked(useMaMyExtensionSessionsQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    expect(screen.queryByText('Chrome on macOS')).not.toBeInTheDocument();
  });

  it('shows the sessions failing with Retry, and none yet', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaMyExtensionSessionsQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Sessions down'), refetch }) as never,
    );
    const first = renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0]);
    expect(refetch).toHaveBeenCalled();
    first.unmount();
    vi.mocked(useMaMyExtensionSessionsQuery).mockReturnValue(
      queryResult({ maMyExtensionSessions: [] }, { refetch }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('The extension is not signed in anywhere yet.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
  });
});

describe('ExtensionPage — Google Meet connection', () => {
  it('starts the Google sign-in and comes back to this page', async () => {
    const assign = stubLocationAssign();
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(screen.getByText('Connect your Google account')).toBeInTheDocument();
    cleanup();
    run.connect.mockResolvedValue({
      data: { maStartGoogleConnect: 'https://accounts.google.com/o/oauth2' },
    });
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Connect Google Meet' }));
    expect(run.connect).toHaveBeenCalledWith({
      variables: { returnTo: 'http://localhost/current' },
    });
    expect(assign).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2');
  });

  it("says why the sign-in could not start, and stays put without Google's address", async () => {
    const assign = stubLocationAssign();
    run.connect.mockRejectedValueOnce(new Error('Google is not configured'));
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Connect Google Meet' }));
    expect(await screen.findByText('Google is not configured')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Connect Google Meet' }));
    expect(assign).not.toHaveBeenCalled();
  });

  it('shows the connected account and its last error, and disconnects after confirming', async () => {
    const user = userEvent.setup();
    connection({
      connected: true,
      email: 'asha@example.com',
      connectedAt: STARTED,
      lastError: 'Token expired once',
    });
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('asha@example.com')).toBeInTheDocument();
    expect(screen.getByText(/^Connected since /)).toBeInTheDocument();
    expect(screen.getByText('Token expired once')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Disconnect' }),
    );
    expect(run.disconnect).toHaveBeenCalled();
    expect(await screen.findByText('Google Meet disconnected')).toBeInTheDocument();
  });

  it('keeps the connection when disconnecting is cancelled, and tolerates missing details', async () => {
    const user = userEvent.setup();
    connection({ connected: true });
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('your Google account')).toBeInTheDocument();
    expect(
      screen.getByText('Meet transcripts and participants are imported after each call.'),
    ).toBeInTheDocument();
    cleanup();
    connection({ connected: true, connectedAt: STARTED });
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText(/^Connected since /)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    expect(run.disconnect).not.toHaveBeenCalled();
  });

  it('says when Google Meet is not configured, and shows loading and errors', async () => {
    connection({ configured: false });
    const first = renderWithProviders(<ExtensionPage />);
    expect(
      screen.getByText('Google Meet is not configured for this company yet.'),
    ).toBeInTheDocument();
    first.unmount();
    vi.mocked(useMaGoogleConnectionQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const second = renderWithProviders(<ExtensionPage />);
    expect(screen.queryByRole('button', { name: 'Connect Google Meet' })).not.toBeInTheDocument();
    second.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaGoogleConnectionQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Connection lookup failed'), refetch }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('Connection lookup failed')).toBeInTheDocument();
    const alert = screen
      .getByText('Connection lookup failed')
      .closest('[role="alert"]') as HTMLElement;
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
