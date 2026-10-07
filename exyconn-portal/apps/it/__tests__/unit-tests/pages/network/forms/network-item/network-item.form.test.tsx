import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ItNetworkKind, ItServiceStatus } from '@exyconn/shell/graphql/generated';
import {
  NetworkItemForm,
  type NetworkItemRow,
} from '../../../../../../src/pages/network/forms/network-item';
import { renderWithProviders } from '../../../../test-utils';
import { networkRow } from '../../../page-kit/fixtures';
import { chooseOption, fill, optionsOf, press } from '../../../page-kit/form-actions';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateItNetworkItemMutation: () => [gql.create],
  useUpdateItNetworkItemMutation: () => [gql.update],
}));

function renderForm(initial: NetworkItemRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<NetworkItemForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('NetworkItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createItNetworkItem: { id: 'net-9' } } });
    gql.update.mockResolvedValue({ data: { updateItNetworkItem: { id: 'net-1' } } });
  });

  it('asks for a name people will recognise', async () => {
    renderForm();
    fill('Name', 'W');

    await press('Create');

    expect(await screen.findByText('Give it a name people will recognise')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers every kind of network item in words', async () => {
    renderForm();

    expect(await optionsOf('Kind')).toEqual([
      'Dns',
      'Firewall',
      'Ip Range',
      'Other',
      'Router',
      'Switch',
      'Vpn',
      'Wifi',
    ]);
  });

  it('creates an active Wi-Fi network unless told otherwise', async () => {
    const { onDone } = renderForm();
    fill('Name', 'Office Wi-Fi');
    fill('Address', ' exy-office ');
    fill('Location', 'Pune');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Office Wi-Fi',
          kind: ItNetworkKind.Wifi,
          address: 'exy-office',
          location: 'Pune',
          provider: '',
          status: ItServiceStatus.Active,
          notes: '',
        },
      },
    });
    expect(await screen.findByText('Network item created')).toBeInTheDocument();
  });

  it('updates an existing item by id with its new state', async () => {
    const { onDone } = renderForm(networkRow({ id: 'net-3' }));

    expect(screen.getByLabelText('Name')).toHaveValue('Office Wi-Fi');
    await chooseOption('Status', 'Degraded');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'net-3',
        input: expect.objectContaining({ name: 'Office Wi-Fi', status: ItServiceStatus.Degraded }),
      },
    });
    expect(await screen.findByText('Network item updated')).toBeInTheDocument();
  });

  it('reports a failed save with a generic message when the error has none', async () => {
    gql.update.mockRejectedValueOnce('offline');
    const { onDone } = renderForm(networkRow());

    await press('Update');

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
