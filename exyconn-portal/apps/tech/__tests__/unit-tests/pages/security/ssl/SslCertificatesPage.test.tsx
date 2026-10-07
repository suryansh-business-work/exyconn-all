import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SslCertificatesPage } from '../../../../../src/pages/security/ssl/SslCertificatesPage';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';
import { CERTIFICATES } from './ssl.fixtures';

const gql = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn(), notify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSslCertificatesQuery: gql.query,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../use-settings.mock')).settingsModule(),
);
vi.mock('@exyconn/shell/components/dashboard/StatRow', async () =>
  (await import('../stat-row.stub')).statRowModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => gql.notify,
}));

const REPORT = {
  sslCertificates: {
    warningDays: 30,
    checkedAt: '2026-10-04T08:00:00.000Z',
    certificates: CERTIFICATES.map(({ id: _id, ...row }) => row),
  },
};

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

function answer(result: Record<string, unknown>) {
  gql.query.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch, ...result });
}

const renderPage = () =>
  renderWithProviders(
    <>
      <SslCertificatesPage />
      <Url />
    </>,
    { route: '/tech/security/ssl' },
  );

const stat = (label: string) =>
  screen.getByTestId(`stat-${label}`).querySelector('dd')?.textContent;

describe('SslCertificatesPage', () => {
  beforeEach(() => {
    gql.query.mockReset();
    gql.refetch.mockReset();
    gql.notify.mockReset();
  });

  it('asks for the cached report, refreshed in the background', () => {
    answer({ loading: true });
    renderPage();
    expect(gql.query).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('progressbar', { name: 'Checking certificates' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  });

  it('summarises every host and lists them', () => {
    answer({ data: REPORT });
    renderPage();
    expect(stat('Hosts checked')).toBe('5');
    expect(stat('Valid')).toBe('1');
    expect(stat('Expiring soon')).toBe('1');
    expect(stat('Expired or invalid')).toBe('2');
    expect(
      screen.getByText(
        'Checked at(2026-10-04T08:00:00.000Z). Expiring soon means 30 days or fewer left.',
      ),
    ).toBeInTheDocument();
    const old = screen.getByText('old.exyconn.com').closest('tr') as HTMLElement;
    expect(within(old).getByText('Expired 3 days ago')).toBeInTheDocument();
    expect(within(old).getByText('CERT_HAS_EXPIRED')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('opens a host’s certificate from its row and closes it again', async () => {
    answer({ data: REPORT });
    renderPage();
    await userEvent.click(screen.getByText('hr.exyconn.com'));
    const dialog = await screen.findByRole('dialog', { name: 'hr.exyconn.com' });
    expect(within(dialog).getByText('12 days')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('points to Status monitors when there is no https host to check', async () => {
    answer({ data: { sslCertificates: { ...REPORT.sslCertificates, certificates: [] } } });
    renderPage();
    expect(screen.getByText('No https hosts to check')).toBeInTheDocument();
    expect(screen.queryByTestId('stat-Hosts checked')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open Status monitors' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/status-monitors');
  });

  it('says why the report could not be read', () => {
    answer({ error: new Error('Forbidden') });
    const { unmount } = renderPage();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    unmount();
    answer({ error: { message: 'not an Error' } });
    renderPage();
    expect(screen.getByText('The certificates could not be checked.')).toBeInTheDocument();
  });

  it('checks every host again on Refresh', async () => {
    let finish: (value: unknown) => void = () => undefined;
    gql.refetch.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    answer({ data: REPORT });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(gql.refetch).toHaveBeenCalledWith({ refresh: true });
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeDisabled();
    expect(screen.getByRole('progressbar', { name: 'Checking certificates' })).toBeInTheDocument();
    finish({});
    expect(await screen.findByRole('button', { name: 'Refresh' })).toBeEnabled();
    expect(gql.notify).not.toHaveBeenCalled();
  });

  it('reports a refresh that fails', async () => {
    gql.refetch.mockRejectedValueOnce(new Error('Timed out')).mockRejectedValueOnce('nope');
    answer({ data: REPORT });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Timed out', 'error'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith('The certificates could not be checked.', 'error'),
    );
  });
});
