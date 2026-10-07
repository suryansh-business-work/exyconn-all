import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DEFAULT_FORMAT_SETTINGS, formatDate } from '@exyconn/i18n';
import { CampaignDetails } from '../../../../src/pages/marketing/CampaignDetails';
import { renderWithProviders } from '../../test-utils';
import { campaignRow } from '../../fixtures';

vi.mock('../../../../src/pages/marketing/CampaignAttribution', () => ({
  CampaignAttribution: ({ campaignId }: Readonly<{ campaignId: string }>) => (
    <p>{`Attribution for ${campaignId}`}</p>
  ),
}));
vi.mock('../../../../src/pages/marketing/CampaignEngagement', () => ({
  CampaignEngagement: ({ campaignId }: Readonly<{ campaignId: string }>) => (
    <p>{`Engagement for ${campaignId}`}</p>
  ),
}));
vi.mock('../../../../src/pages/marketing/CampaignDeliveryLog', () => ({
  CampaignDeliveryLog: ({ campaignId }: Readonly<{ campaignId: string }>) => (
    <p>{`Delivery for ${campaignId}`}</p>
  ),
}));

const day = (iso: string) => formatDate(iso, DEFAULT_FORMAT_SETTINGS);

describe('CampaignDetails', () => {
  it('summarises the campaign, its schedule and its email content', () => {
    const campaign = campaignRow({
      lastSentAt: '2026-10-03T08:00:00.000Z',
      recipientsCount: 250,
      scheduledAt: '2026-10-10T08:00:00.000Z',
    });
    renderWithProviders(<CampaignDetails campaign={campaign} />);

    expect(screen.getByText('Diwali offer')).toBeInTheDocument();
    expect(screen.getByText('EMAIL')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText(`₹${(120000).toLocaleString()}`)).toBeInTheDocument();
    expect(
      screen.getByText(`${day(campaign.startDate)} → ${day(campaign.endDate)}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${day('2026-10-03T08:00:00.000Z')} · 250 recipient(s)`),
    ).toBeInTheDocument();
    expect(screen.getByText(day('2026-10-10T08:00:00.000Z'))).toBeInTheDocument();
    expect(screen.getByText('Festive savings')).toBeInTheDocument();
    expect(screen.getByText('Hello {{name}}')).toBeInTheDocument();
  });

  it('shows the attribution, engagement and delivery of this campaign', () => {
    renderWithProviders(<CampaignDetails campaign={campaignRow({ id: 'campaign-8' })} />);

    expect(screen.getByText('Attribution for campaign-8')).toBeInTheDocument();
    expect(screen.getByText('Engagement for campaign-8')).toBeInTheDocument();
    expect(screen.getByText('Delivery for campaign-8')).toBeInTheDocument();
  });

  it('says what has not happened yet and what is missing from the email', () => {
    const campaign = campaignRow({ subject: '', body: null, lastSentAt: null, scheduledAt: null });
    renderWithProviders(<CampaignDetails campaign={campaign} />);

    expect(screen.getByText('Not sent yet')).toBeInTheDocument();
    expect(screen.getByText('Not scheduled')).toBeInTheDocument();
    expect(screen.getAllByText('— none —')).toHaveLength(2);
  });

  it('counts zero recipients when a send recorded none', () => {
    const campaign = campaignRow({ lastSentAt: '2026-10-03T08:00:00.000Z', recipientsCount: null });
    renderWithProviders(<CampaignDetails campaign={campaign} />);

    expect(
      screen.getByText(`${day('2026-10-03T08:00:00.000Z')} · 0 recipient(s)`),
    ).toBeInTheDocument();
  });
});
