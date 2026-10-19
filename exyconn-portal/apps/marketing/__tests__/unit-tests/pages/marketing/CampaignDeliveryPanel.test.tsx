import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDateTime } from '@exyconn/i18n';
import {
  CampaignSendState,
  type CampaignDeliveryStatsQuery,
} from '@exyconn/shell/graphql/generated';
import { CampaignDeliveryPanel } from '../../../../src/pages/marketing/CampaignDeliveryPanel';
import { renderWithProviders } from '../../test-utils';

type Stats = CampaignDeliveryStatsQuery['campaignDeliveryStats'];

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
  cancel: vi.fn(),
  retry: vi.fn(),
  retrying: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCampaignDeliveryStatsQuery: (options: unknown) => gql.stats(options),
  useCancelCampaignSendMutation: () => [gql.cancel],
  useRetryCampaignFailuresMutation: () => [gql.retry, { loading: gql.retrying }],
}));

const SCHEDULED_AT = '2026-10-21T08:00:00.000Z';
const LAST_SENT_AT = '2026-10-19T12:15:00.000Z';

function stats(overrides: Partial<Stats> = {}): Stats {
  return {
    runId: 'run-1',
    sendState: CampaignSendState.Sent,
    scheduledAt: null,
    lastSentAt: null,
    resolved: 200,
    eligible: 1500,
    queued: 0,
    sent: 1400,
    failed: 0,
    skipped: 100,
    bounced: null,
    unsubscribed: 3,
    preferenceChanges: 2,
    clicked: 70,
    estimatedOpens: 600,
    clickRate: 5,
    ...overrides,
  };
}

function answer(value: Partial<{ data: unknown; loading: boolean; error: Error }>) {
  gql.stats.mockReturnValue({
    data: undefined,
    loading: false,
    error: undefined,
    refetch: gql.refetch,
    startPolling: gql.startPolling,
    stopPolling: gql.stopPolling,
    ...value,
  });
}

const withStats = (overrides: Partial<Stats> = {}) =>
  answer({ data: { campaignDeliveryStats: stats(overrides) } });

describe('CampaignDeliveryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.retrying = false;
    gql.refetch.mockResolvedValue({});
    gql.cancel.mockResolvedValue({ data: { cancelCampaignSend: true } });
    gql.retry.mockResolvedValue({ data: { retryCampaignFailures: true } });
    withStats();
  });

  it('reads this campaign’s figures fresh from the server', () => {
    renderWithProviders(<CampaignDeliveryPanel campaignId="campaign-3" />);

    expect(gql.stats).toHaveBeenCalledWith({
      variables: { campaignId: 'campaign-3' },
      fetchPolicy: 'network-only',
    });
  });

  it('shows a placeholder while the first figures load', () => {
    answer({ loading: true });
    const { container } = renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByText('Total eligible')).not.toBeInTheDocument();
  });

  it('keeps showing the figures while a poll is in flight', () => {
    answer({ loading: true, data: { campaignDeliveryStats: stats() } });
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(screen.getByText('Total eligible')).toBeInTheDocument();
  });

  it('shows the error when the figures cannot be read', () => {
    answer({ error: new Error('Campaign not found') });
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Campaign not found');
  });

  it('renders nothing when there is no send yet', () => {
    answer({});
    const { container } = renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('lists every figure with what it means once a send has settled', () => {
    withStats({ lastSentAt: LAST_SENT_AT });
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(screen.getByText('SENT')).toBeInTheDocument();
    expect(
      screen.getByText(`Last sent ${formatDateTime(LAST_SENT_AT, DEFAULT_FORMAT_SETTINGS)}`),
    ).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('1,400')).toBeInTheDocument();
    expect(screen.getByText('Accepted by the mail server')).toBeInTheDocument();
    expect(screen.getByText('Suppressed, opted out or excluded')).toBeInTheDocument();
    expect(screen.getByText('5% of sent')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(gql.stopPolling).toHaveBeenCalled();
    expect(gql.startPolling).not.toHaveBeenCalled();
  });

  it('shows the bounce count when the mail provider reports one', () => {
    withStats({ bounced: 12 });
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('says when a queued send is scheduled for', () => {
    withStats({ sendState: CampaignSendState.Queued, scheduledAt: SCHEDULED_AT, resolved: 0 });
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(
      screen.getByText(`Scheduled for ${formatDateTime(SCHEDULED_AT, DEFAULT_FORMAT_SETTINGS)}`),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not repeat the schedule once the send has moved on', () => {
    withStats({ sendState: CampaignSendState.Sent, scheduledAt: SCHEDULED_AT });
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(screen.queryByText(/^Scheduled for/)).not.toBeInTheDocument();
  });

  it('polls and shows progress while sending, offering only Cancel', () => {
    withStats({ sendState: CampaignSendState.Sending, sent: 90, failed: 5, skipped: 5 });
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(gql.startPolling).toHaveBeenCalledWith(5000);
    expect(screen.getByRole('progressbar', { name: 'Send progress' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.getByText('100 of 200 processed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel send' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry failed copies' })).not.toBeInTheDocument();
  });

  it('stops polling when it goes away', () => {
    withStats({ sendState: CampaignSendState.Sending });
    const { unmount } = renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);
    gql.stopPolling.mockClear();

    unmount();

    expect(gql.stopPolling).toHaveBeenCalledTimes(1);
  });

  it('cancels a running send after confirming, then re-reads the figures', async () => {
    withStats({ sendState: CampaignSendState.Sending });
    const onChanged = vi.fn();
    renderWithProviders(<CampaignDeliveryPanel campaignId="campaign-3" onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel send' }));
    expect(await screen.findByText('Cancel this send?')).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel send' }),
    );

    expect(await screen.findByText('Send cancelled')).toBeInTheDocument();
    expect(gql.cancel).toHaveBeenCalledWith({ variables: { id: 'campaign-3' } });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('retries the failed copies after confirming, without a change handler', async () => {
    withStats({ failed: 4 });
    renderWithProviders(<CampaignDeliveryPanel campaignId="campaign-3" />);

    await userEvent.click(screen.getByRole('button', { name: 'Retry failed copies' }));
    expect(
      await screen.findByText(
        'Only the copies that failed are sent again. Nobody gets a second copy.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Failed copies sent again')).toBeInTheDocument();
    expect(gql.retry).toHaveBeenCalledWith({ variables: { id: 'campaign-3' } });
    expect(gql.cancel).not.toHaveBeenCalled();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('disables Retry while a retry is running', () => {
    gql.retrying = true;
    withStats({ failed: 4 });
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    expect(screen.getByRole('button', { name: 'Retry failed copies' })).toBeDisabled();
  });

  it('does nothing when the confirmation is declined', async () => {
    withStats({ failed: 4 });
    const onChanged = vi.fn();
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button', { name: 'Retry failed copies' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Retry failed copies?')).not.toBeInTheDocument());
    expect(gql.retry).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('reports a failed action and leaves the figures alone', async () => {
    gql.retry.mockRejectedValue(new Error('Run already finished'));
    withStats({ failed: 4 });
    const onChanged = vi.fn();
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button', { name: 'Retry failed copies' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Run already finished')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure has none', async () => {
    gql.cancel.mockRejectedValue('boom');
    withStats({ sendState: CampaignSendState.Queued });
    renderWithProviders(<CampaignDeliveryPanel campaignId="c" />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel send' }));
    await screen.findByText('Cancel this send?');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel send' }),
    );

    expect(await screen.findByText('That did not work')).toBeInTheDocument();
  });
});
