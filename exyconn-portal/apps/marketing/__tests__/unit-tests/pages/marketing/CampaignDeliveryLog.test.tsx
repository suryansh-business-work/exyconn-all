import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDateTime } from '@exyconn/i18n';
import { CampaignSendStatus } from '@exyconn/shell/graphql/generated';
import { CampaignDeliveryLog } from '../../../../src/pages/marketing/CampaignDeliveryLog';
import { renderWithProviders } from '../../test-utils';
import { answered, pending } from '../../fixtures';

const gql = vi.hoisted(() => ({ sends: vi.fn(), summary: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCampaignSendsQuery: (options: unknown) => gql.sends(options),
  useCampaignSendSummaryQuery: (options: unknown) => gql.summary(options),
}));

const SENT_AT = '2026-09-02T09:30:00.000Z';
const SENDS = [
  {
    id: 's1',
    to: 'asha@acme.io',
    recipientName: 'Asha Rao',
    status: CampaignSendStatus.Sent,
    error: '',
    sentAt: SENT_AT,
  },
  {
    id: 's2',
    to: 'ravi@globex.com',
    recipientName: '',
    status: CampaignSendStatus.Failed,
    error: 'Mailbox unavailable',
    sentAt: SENT_AT,
  },
];

describe('CampaignDeliveryLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.sends.mockReturnValue({ ...answered({ listCampaignSends: SENDS }), refetch: gql.refetch });
    gql.summary.mockReturnValue(
      answered({ campaignSendSummary: { sent: 3, failed: 1, skipped: 2 } }),
    );
  });

  it('asks for the sends and the summary of this campaign', () => {
    renderWithProviders(<CampaignDeliveryLog campaignId="campaign-5" />);

    expect(gql.sends).toHaveBeenCalledWith({ variables: { campaignId: 'campaign-5' } });
    expect(gql.summary).toHaveBeenCalledWith({ variables: { campaignId: 'campaign-5' } });
    expect(screen.getByText('3 sent · 1 failed · 2 skipped')).toBeInTheDocument();
  });

  it('lists each recipient with the outcome, the time and the reason', () => {
    renderWithProviders(<CampaignDeliveryLog campaignId="campaign-5" />);
    const [, sent, failed] = screen.getAllByRole('row');
    const when = formatDateTime(SENT_AT, DEFAULT_FORMAT_SETTINGS);

    expect(within(sent).getByText('Asha Rao')).toBeInTheDocument();
    expect(within(sent).getByText('SENT')).toBeInTheDocument();
    expect(within(sent).getByText(when)).toBeInTheDocument();
    expect(within(sent).getByText('—')).toBeInTheDocument();
    expect(within(failed).getByText('ravi@globex.com')).toBeInTheDocument();
    expect(within(failed).getByText('FAILED')).toBeInTheDocument();
    expect(within(failed).getByText('Mailbox unavailable')).toBeInTheDocument();
  });

  it('re-reads the sends when the table is refreshed', async () => {
    renderWithProviders(<CampaignDeliveryLog campaignId="campaign-5" />);

    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('says the campaign has not gone out, with no summary, before any send', () => {
    gql.sends.mockReturnValue(answered({ listCampaignSends: [] }));
    gql.summary.mockReturnValue(answered(undefined));
    renderWithProviders(<CampaignDeliveryLog campaignId="campaign-5" />);

    expect(screen.getByText('This campaign has not been sent yet.')).toBeInTheDocument();
    expect(screen.queryByText(/sent ·/)).not.toBeInTheDocument();
  });

  it('holds the table busy and does not say nothing was sent while the first answer loads', () => {
    gql.sends.mockReturnValue(pending());
    gql.summary.mockReturnValue(pending());
    const { container } = renderWithProviders(<CampaignDeliveryLog campaignId="campaign-5" />);

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('This campaign has not been sent yet.')).not.toBeInTheDocument();
  });
});
