import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AssetStatus } from '@exyconn/shell/graphql/generated';
import { HeldAssetsPanel } from '../../../../src/pages/exits/HeldAssetsPanel';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ heldAssets: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useExitRecordHeldAssetsQuery: (options: unknown) => gql.heldAssets(options),
}));

const laptop = {
  id: 'asset-1',
  assetTag: 'LAP-042',
  name: 'MacBook Pro',
  status: AssetStatus.Assigned,
};
const phone = { id: 'asset-2', assetTag: 'PHN-007', name: 'Pixel 9', status: AssetStatus.InRepair };

/** The register answers with these assets held by the leaver. */
function registerHolds(assets: (typeof laptop)[]) {
  gql.heldAssets.mockReturnValue({
    data: { getExitRecord: { id: 'exit-1', heldAssets: assets } },
    loading: false,
  });
}

describe('HeldAssetsPanel', () => {
  beforeEach(() => {
    gql.heldAssets.mockReset();
  });

  it('asks the register about this exit, always going back to the network', () => {
    registerHolds([]);
    renderWithProviders(<HeldAssetsPanel exitId="exit-1" assetsReturned={false} />);

    expect(gql.heldAssets).toHaveBeenCalledWith({
      variables: { id: 'exit-1' },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('says it is checking until the register first answers', () => {
    gql.heldAssets.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<HeldAssetsPanel exitId="exit-1" assetsReturned={false} />);

    expect(screen.getByText('Checking the asset register…')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Assets held' })).not.toBeInTheDocument();
  });

  it('keeps showing the last answer while the register refreshes', () => {
    gql.heldAssets.mockReturnValue({
      data: { getExitRecord: { id: 'exit-1', heldAssets: [] } },
      loading: true,
    });
    renderWithProviders(<HeldAssetsPanel exitId="exit-1" assetsReturned={false} />);

    expect(screen.getByRole('heading', { name: 'Assets held' })).toBeInTheDocument();
    expect(screen.queryByText('Checking the asset register…')).not.toBeInTheDocument();
  });

  it('confirms when the leaver holds nothing', () => {
    registerHolds([]);
    renderWithProviders(<HeldAssetsPanel exitId="exit-1" assetsReturned={false} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Nothing outstanding in the asset register.',
    );
  });

  it('lists what is still assigned and asks for it back before clearance', () => {
    registerHolds([laptop, phone]);
    renderWithProviders(<HeldAssetsPanel exitId="exit-1" assetsReturned={false} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      '2 asset(s) still assigned — collect them before clearance.',
    );
    expect(screen.getByText('LAP-042')).toBeInTheDocument();
    expect(screen.getByText('PHN-007')).toBeInTheDocument();
    expect(screen.getByText(/MacBook Pro/)).toBeInTheDocument();
    expect(screen.getByText('ASSIGNED')).toBeInTheDocument();
    expect(screen.getByText('IN REPAIR')).toBeInTheDocument();
  });

  it('warns when the record says returned but the register disagrees', () => {
    registerHolds([laptop]);
    renderWithProviders(<HeldAssetsPanel exitId="exit-1" assetsReturned />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Marked as returned, but 1 asset(s) are still assigned in the register.',
    );
  });

  it('does not contradict a record marked returned when the register agrees', () => {
    registerHolds([]);
    renderWithProviders(<HeldAssetsPanel exitId="exit-1" assetsReturned />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Nothing outstanding in the asset register.',
    );
  });
});
