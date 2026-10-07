import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CampaignAttribution } from '../../../../src/pages/marketing/CampaignAttribution';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ leads: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useLeadsByCampaignQuery: (options: unknown) => gql.leads(options),
}));

describe('CampaignAttribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('credits the campaign with the leads the server counts for it', () => {
    gql.leads.mockReturnValue({ loading: false, data: { leadsByCampaign: 7 } });
    renderWithProviders(<CampaignAttribution campaignId="campaign-3" />);

    expect(gql.leads).toHaveBeenCalledWith({ variables: { campaignId: 'campaign-3' } });
    expect(screen.getByText('Leads generated')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows an ellipsis while counting', () => {
    gql.leads.mockReturnValue({ loading: true, data: undefined });
    renderWithProviders(<CampaignAttribution campaignId="campaign-3" />);

    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('shows zero when the count did not arrive', () => {
    gql.leads.mockReturnValue({ loading: false, data: undefined });
    renderWithProviders(<CampaignAttribution campaignId="campaign-3" />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
