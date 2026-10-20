import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { CampaignStudioPage, studioPath } from '../../../../src/pages/marketing/CampaignStudioPage';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { campaignRow } from '../../fixtures';

const gql = vi.hoisted(() => ({ campaign: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetCampaignQuery: (options: unknown) => gql.campaign(options),
}));

/** The studio itself has its own tests; here it shows what it was opened with. */
vi.mock('../../../../src/pages/marketing/forms/campaign', () => ({
  CampaignForm: ({
    initial,
    onExit,
  }: Readonly<{ initial: { id: string; name: string } | null; onExit: () => void }>) => (
    <section aria-label="Studio">
      {initial ? initial.name : 'new'}
      <button type="button" onClick={onExit}>
        Exit studio
      </button>
    </section>
  ),
}));

function Url() {
  return <output aria-label="Url">{useCurrentUrl()}</output>;
}

const renderAt = (route: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/marketing/campaigns/:campaignId" element={<CampaignStudioPage />} />
      <Route path="/marketing/campaigns" element={<Url />} />
    </Routes>,
    { route },
  );

describe('studioPath', () => {
  it('points at a new or saved campaign, optionally on a step', () => {
    expect(studioPath(null)).toBe('/marketing/campaigns/new');
    expect(studioPath('c1')).toBe('/marketing/campaigns/c1');
    expect(studioPath('c1', 'review')).toBe('/marketing/campaigns/c1?step=review');
    expect(studioPath(null, '')).toBe('/marketing/campaigns/new');
  });
});

describe('CampaignStudioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.campaign.mockReturnValue({ data: undefined, loading: false, error: undefined });
  });

  it('opens an empty studio for a new campaign without loading anything', () => {
    renderAt('/marketing/campaigns/new');
    expect(screen.getByRole('region', { name: 'Studio' })).toHaveTextContent('new');
    expect(gql.campaign).toHaveBeenCalledWith({
      variables: { id: 'new' },
      skip: true,
      fetchPolicy: 'network-only',
    });
  });

  it('shows a placeholder while a saved campaign loads', () => {
    gql.campaign.mockReturnValue({ data: undefined, loading: true });
    renderAt('/marketing/campaigns/campaign-1');
    expect(gql.campaign).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'campaign-1' }, skip: false }),
    );
    expect(screen.getByLabelText('Loading the campaign…')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Studio' })).not.toBeInTheDocument();
  });

  it('says why a campaign could not be loaded', () => {
    gql.campaign.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Not found'),
    });
    renderAt('/marketing/campaigns/campaign-1');
    expect(screen.getByRole('alert')).toHaveTextContent('Not found');
  });

  it('opens the studio on the loaded campaign', () => {
    gql.campaign.mockReturnValue({
      data: { getCampaign: campaignRow({ name: 'Diwali offer' }) },
      loading: false,
    });
    renderAt('/marketing/campaigns/campaign-1');
    expect(screen.getByRole('region', { name: 'Studio' })).toHaveTextContent('Diwali offer');
  });

  it('falls back to a new studio when a saved campaign gives nothing back', () => {
    renderAt('/marketing/campaigns/campaign-1');
    expect(screen.getByRole('region', { name: 'Studio' })).toHaveTextContent('new');
  });

  it('goes back to the campaign list on exit', async () => {
    renderAt('/marketing/campaigns/new');
    await userEvent.click(screen.getByRole('button', { name: 'Exit studio' }));
    expect(screen.getByRole('status', { name: 'Url' })).toHaveTextContent(
      /^\/marketing\/campaigns$/,
    );
  });
});
