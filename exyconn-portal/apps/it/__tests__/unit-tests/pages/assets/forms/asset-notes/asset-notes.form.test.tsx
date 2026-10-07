import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { AssetNotesForm } from '../../../../../../src/pages/assets/forms/asset-notes';
import { assetRow } from '../../../../core/rows.fixtures';
import { fill, press, toast } from '../../../../core/form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateAssetMutation: () => [gql.update],
}));

const onDone = vi.fn();
const asset = assetRow();

describe('AssetNotesForm', () => {
  beforeEach(() => {
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
  });

  it('saves the note and resends every other field exactly as it came', async () => {
    renderWithProviders(<AssetNotesForm asset={asset} onDone={onDone} />);
    expect(screen.getByLabelText('Notes')).toHaveValue('Keyboard replaced');
    fill('Notes', '  Battery swapped  ');
    await press('Save notes');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'asset-1',
        input: {
          assetTag: 'LT-001',
          name: 'ThinkPad X1',
          category: asset.category,
          status: asset.status,
          manufacturer: 'Lenovo',
          modelName: 'X1 Carbon',
          serialNumber: 'SN-42',
          assignedToId: '',
          assignedToName: '',
          location: 'Pune',
          purchaseDate: '2025-01-10T00:00:00.000Z',
          warrantyExpiry: '2028-01-10T00:00:00.000Z',
          purchaseCost: 1500,
          notes: 'Battery swapped',
        },
      },
    });
    expect(await toast()).toHaveTextContent('Notes saved');
  });

  it('puts the saved note back on Cancel', async () => {
    renderWithProviders(<AssetNotesForm asset={asset} onDone={onDone} />);
    fill('Notes', 'Half-written thought');
    await press('Cancel');
    await waitFor(() => expect(screen.getByLabelText('Notes')).toHaveValue('Keyboard replaced'));
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('caps the notes at 2000 characters', async () => {
    renderWithProviders(<AssetNotesForm asset={asset} onDone={onDone} />);
    fill('Notes', 'x'.repeat(2001));
    await press('Save notes');
    expect(await screen.findByText('Keep notes under 2000 characters')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('says why a save failed and keeps the note', async () => {
    gql.update.mockRejectedValue(new Error('Asset was deleted'));
    renderWithProviders(<AssetNotesForm asset={asset} onDone={onDone} />);
    await press('Save notes');
    expect(await toast()).toHaveTextContent('Asset was deleted');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.update.mockRejectedValue('offline');
    renderWithProviders(<AssetNotesForm asset={asset} onDone={onDone} />);
    await press('Save notes');
    expect(await toast()).toHaveTextContent('Could not save the notes');
  });
});
