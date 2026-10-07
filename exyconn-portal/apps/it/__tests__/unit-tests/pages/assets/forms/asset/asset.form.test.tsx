import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { AssetStatus } from '@exyconn/shell/graphql/generated';
import { AssetForm, type AssetRow } from '../../../../../../src/pages/assets/forms/asset';
import { ASSIGNEE, ASSIGNEE_LABEL, assetRow } from '../../../../core/rows.fixtures';
import { fill, pickOption, press, toast } from '../../../../core/form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), assignees: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateAssetMutation: () => [gql.create],
  useUpdateAssetMutation: () => [gql.update],
  useListAssetAssigneesQuery: gql.assignees,
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: AssetRow | null = null) =>
  renderWithProviders(<AssetForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('AssetForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.assignees.mockReset().mockReturnValue({ data: { listAssetAssignees: [ASSIGNEE] } });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks for a tag and a name', async () => {
    renderForm();
    await press('Create');
    expect(await screen.findByText('Asset tag is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('adds an item to stock with no holder and no dates', async () => {
    renderForm();
    expect(screen.queryByRole('combobox', { name: /^Assigned to/ })).not.toBeInTheDocument();
    fill('Asset tag', 'LT-002');
    fill('Name', 'MacBook Air');
    fill('Purchase cost', '999');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          assetTag: 'LT-002',
          name: 'MacBook Air',
          status: AssetStatus.InStock,
          purchaseCost: 999,
          assignedToId: '',
          assignedToName: '',
          purchaseDate: null,
          warrantyExpiry: null,
          edrCheckedAt: null,
        }),
      },
    });
    expect(await toast()).toHaveTextContent('Asset created');
  });

  it('refuses a negative cost', async () => {
    renderForm();
    fill('Asset tag', 'LT-002');
    fill('Name', 'MacBook Air');
    fill('Purchase cost', '-5');
    await press('Create');
    expect(await screen.findByText('Cost cannot be negative')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('asks who holds an assigned asset and sends their name with it', async () => {
    renderForm();
    fill('Asset tag', 'LT-003');
    fill('Name', 'Dell XPS');
    await pickOption(/^Status/, 'Assigned');
    await press('Create');
    expect(await screen.findByText('Choose who the asset is assigned to')).toBeInTheDocument();

    await pickOption(/^Assigned to/, ASSIGNEE_LABEL);
    await press('Create');
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          status: AssetStatus.Assigned,
          assignedToId: 'emp-1',
          assignedToName: 'Ana Rao',
        }),
      },
    });
  });

  it('saves an edit, leaving the holder name blank until the people list loads', async () => {
    gql.assignees.mockReturnValue({ data: undefined });
    renderForm(
      assetRow({ status: AssetStatus.Assigned, assignedToId: 'emp-1', assignedToName: 'Ana Rao' }),
    );
    expect(screen.getByLabelText('Asset tag')).toHaveValue('LT-001');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'asset-1',
        input: expect.objectContaining({
          assetTag: 'LT-001',
          assignedToId: 'emp-1',
          assignedToName: '',
          purchaseDate: '2025-01-10T00:00:00.000Z',
          installedSoftware: ['Office'],
        }),
      },
    });
    expect(await toast()).toHaveTextContent('Asset updated');
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('Asset tag already in use'));
    renderForm(assetRow());
    await press('Update');
    expect(await toast()).toHaveTextContent('Asset tag already in use');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
