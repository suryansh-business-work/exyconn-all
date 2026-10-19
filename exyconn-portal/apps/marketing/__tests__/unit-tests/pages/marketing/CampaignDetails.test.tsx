import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CampaignType } from '@exyconn/shell/graphql/generated';
import { CampaignDetails } from '../../../../src/pages/marketing/CampaignDetails';
import { renderWithProviders } from '../../test-utils';
import { campaignRow } from '../../fixtures';

const gql = vi.hoisted(() => ({ revisions: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCampaignRevisionsQuery: (options: unknown) => gql.revisions(options),
}));

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
vi.mock('../../../../src/pages/marketing/CampaignDeliveryPanel', () => ({
  CampaignDeliveryPanel: ({ campaignId }: Readonly<{ campaignId: string }>) => (
    <p>{`Delivery panel for ${campaignId}`}</p>
  ),
}));

const revision = (overrides: Record<string, unknown> = {}) => ({
  __typename: 'CampaignRevision',
  id: 'rev-1',
  version: 2,
  subject: 'Festive savings',
  createdByName: 'Asha Rao',
  createdAt: '2026-10-03T08:00:00.000Z',
  ...overrides,
});

describe('CampaignDetails', () => {
  beforeEach(() => {
    gql.revisions.mockReset();
    gql.revisions.mockReturnValue({ data: { campaignRevisions: [] } });
  });

  it('summarises the campaign: name, type, sender, subject and preview text', () => {
    const campaign = campaignRow({
      campaignType: CampaignType.Promotional,
      preheader: 'Up to 40% off',
    });
    renderWithProviders(<CampaignDetails campaign={campaign} />);

    expect(screen.getByText('Diwali offer')).toBeInTheDocument();
    expect(screen.getByText(CampaignType.Promotional, { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Exyconn <hello@exyconn.com>')).toBeInTheDocument();
    expect(screen.getByText('Festive savings')).toBeInTheDocument();
    expect(screen.getByText('Up to 40% off')).toBeInTheDocument();
  });

  it('links to the campaign in the studio', () => {
    renderWithProviders(<CampaignDetails campaign={campaignRow({ id: 'campaign-3' })} />);

    expect(screen.getByRole('link', { name: 'Open in the studio' })).toHaveAttribute(
      'href',
      '/marketing/campaigns/campaign-3',
    );
  });

  it('says what is missing: no sender, subject or preview text', () => {
    const campaign = campaignRow({ senderEmail: '', subject: null, preheader: '' });
    renderWithProviders(<CampaignDetails campaign={campaign} />);

    expect(screen.getByText('Not set')).toBeInTheDocument();
    expect(screen.getAllByText('— none —')).toHaveLength(2);
  });

  it('shows the attribution, delivery and engagement of this campaign', () => {
    renderWithProviders(<CampaignDetails campaign={campaignRow({ id: 'campaign-8' })} />);

    expect(screen.getByText('Attribution for campaign-8')).toBeInTheDocument();
    expect(screen.getByText('Delivery panel for campaign-8')).toBeInTheDocument();
    expect(screen.getByText('Engagement for campaign-8')).toBeInTheDocument();
    expect(screen.getByText('Delivery for campaign-8')).toBeInTheDocument();
    expect(gql.revisions).toHaveBeenCalledWith({ variables: { campaignId: 'campaign-8' } });
  });

  it('says there are no sending revisions before a send, or while they load', () => {
    gql.revisions.mockReturnValue({ data: undefined });
    renderWithProviders(<CampaignDetails campaign={campaignRow()} />);

    expect(screen.getByText('No sending revisions yet.')).toBeInTheDocument();
  });

  it('lists each frozen revision with who made it, or System when nobody did', () => {
    gql.revisions.mockReturnValue({
      data: {
        campaignRevisions: [
          revision(),
          revision({ id: 'rev-0', version: 1, subject: 'Draft', createdByName: '' }),
        ],
      },
    });
    renderWithProviders(<CampaignDetails campaign={campaignRow()} />);

    expect(screen.getByText('Revision 2 — Festive savings')).toBeInTheDocument();
    expect(screen.getByText('Revision 1 — Draft')).toBeInTheDocument();
    expect(screen.getByText(/^Asha Rao · /)).toBeInTheDocument();
    expect(screen.getByText(/^System · /)).toBeInTheDocument();
    expect(screen.queryByText('No sending revisions yet.')).toBeNull();
  });
});
