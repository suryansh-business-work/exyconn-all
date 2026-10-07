import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { AssetStatus } from '@exyconn/shell/graphql/generated';
import { AssetDetailPage } from '../../../../../src/pages/assets';
import { assetRow } from '../../../core/rows.fixtures';
import { press, toast } from '../../../core/form.helpers';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({
  asset: vi.fn(),
  history: vi.fn(),
  seats: vi.fn(),
  update: vi.fn(),
  refetch: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => gql.navigate,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetAssetQuery: gql.asset,
  useAssetAssignmentsQuery: gql.history,
  useLicenceSeatsForQuery: gql.seats,
  useUpdateAssetMutation: () => [gql.update],
}));

const showAsset = (asset: object | undefined, loading = false) =>
  gql.asset.mockReturnValue({
    data: asset ? { getAsset: asset } : undefined,
    loading,
    refetch: gql.refetch,
  });

const renderAt = (id = 'asset-1') =>
  renderWithProviders(<AssetDetailPage />, { route: `/it/assets/${id}`, path: '/it/assets/:id' });

describe('AssetDetailPage', () => {
  beforeEach(() => {
    Object.values(gql).forEach((fn) => fn.mockReset());
    gql.history.mockReturnValue({ data: undefined, loading: false, refetch: vi.fn() });
    gql.seats.mockReturnValue({ data: { licenceSeatsFor: [] }, loading: false });
    gql.refetch.mockResolvedValue({ data: {} });
    gql.update.mockResolvedValue({ data: {} });
  });

  it('shows a spinner while the asset loads, reading it and its history fresh', () => {
    showAsset(undefined, true);
    renderAt();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(gql.asset).toHaveBeenCalledWith({ variables: { id: 'asset-1' }, skip: false });
    expect(gql.history).toHaveBeenCalledWith({
      variables: { assetId: 'asset-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
  });

  it('says the asset is gone when there is none, without asking for one with no id', () => {
    showAsset(undefined);
    renderWithProviders(<AssetDetailPage />);
    expect(screen.getByText('That asset no longer exists.')).toBeInTheDocument();
    expect(gql.asset).toHaveBeenCalledWith({ variables: { id: '' }, skip: true });
  });

  it('lays out what the asset is, what it cost and that nobody holds it', () => {
    showAsset(assetRow({ modelName: '', purchaseDate: null, purchaseCost: 125000 }), true);
    renderAt();
    expect(screen.getByRole('heading', { name: 'ThinkPad X1' })).toBeInTheDocument();
    expect(screen.getByText('LT-001')).toBeInTheDocument();
    expect(screen.getByText('LAPTOP')).toBeInTheDocument();
    expect(screen.getByText('IN STOCK')).toBeInTheDocument();
    expect(screen.getByText('Lenovo')).toBeInTheDocument();
    expect(screen.getByText('on 2028-01-10T00:00:00.000Z')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText((125000).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText('Nobody')).toBeInTheDocument();
    expect(screen.getByText('This asset has never been assigned.')).toBeInTheDocument();
    expect(screen.queryByText(/Licences held/)).not.toBeInTheDocument();
  });

  it('fills every blank fact with a dash', () => {
    showAsset(
      assetRow({
        manufacturer: '',
        modelName: '',
        serialNumber: '',
        location: '',
        purchaseDate: null,
        warrantyExpiry: null,
      }),
    );
    renderAt();
    expect(screen.getAllByText('—')).toHaveLength(6);
  });

  it('shows the holder, their hand-overs and their licence seats', () => {
    showAsset(
      assetRow({ status: AssetStatus.Assigned, assignedToId: 'emp-1', assignedToName: 'Ana Rao' }),
    );
    gql.history.mockReturnValue({
      data: {
        assetAssignments: [
          {
            id: 'as-1',
            assetTag: 'LT-001',
            employeeId: 'emp-1',
            employeeName: 'Ana Rao',
            assignedAt: '2026-01-01',
            returnedAt: null,
            assignedByName: 'Ravi',
            note: '',
          },
        ],
      },
      loading: false,
      refetch: vi.fn(),
    });
    renderAt();
    expect(screen.getByText('Assignment history (1)')).toBeInTheDocument();
    expect(screen.getByText('Licences held by Ana Rao (0)')).toBeInTheDocument();
    expect(gql.seats).toHaveBeenCalledWith({ variables: { employeeId: 'emp-1' }, skip: false });
  });

  it('goes back to the register', async () => {
    showAsset(assetRow());
    renderAt();
    await press('Assets');
    expect(gql.navigate).toHaveBeenCalledWith('/it/assets');
  });

  it('re-reads the asset after its notes are saved', async () => {
    showAsset(assetRow());
    renderAt();
    await press('Save notes');
    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'asset-1', input: expect.objectContaining({ notes: 'Keyboard replaced' }) },
    });
    expect(await toast()).toHaveTextContent('Notes saved');
  });

  it('keeps the page up when that re-read fails', async () => {
    gql.refetch.mockRejectedValue(new Error('offline'));
    showAsset(assetRow());
    renderAt();
    await press('Save notes');
    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('heading', { name: 'ThinkPad X1' })).toBeInTheDocument();
  });
});
