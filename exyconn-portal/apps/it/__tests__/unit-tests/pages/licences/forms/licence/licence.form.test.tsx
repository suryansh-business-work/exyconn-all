import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { LicenceBillingCycle, LicenceStatus } from '@exyconn/shell/graphql/generated';
import { LicenceForm, type LicenceRow } from '../../../../../../src/pages/licences/forms/licence';
import { renderWithProviders } from '../../../../test-utils';
import { licenceRow } from '../../../page-kit/fixtures';
import { fill, press } from '../../../page-kit/form-actions';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), assignees: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateLicenceMutation: () => [gql.create],
  useUpdateLicenceMutation: () => [gql.update],
  useListAssetAssigneesQuery: () => gql.assignees(),
}));

const people = [
  { __typename: 'AssetAssignee', id: 'u1', name: 'Asha Rao', email: 'asha@exyconn.test' },
  { __typename: 'AssetAssignee', id: 'u2', name: 'Ravi Kumar', email: 'ravi@exyconn.test' },
];

function renderForm(initial: LicenceRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<LicenceForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('LicenceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createLicence: { id: 'licence-9' } } });
    gql.update.mockResolvedValue({ data: { updateLicence: { id: 'licence-1' } } });
    gql.assignees.mockReturnValue({ data: undefined });
  });

  it('requires a name and a vendor before it saves', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Vendor is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active yearly licence from what was typed', async () => {
    const { onDone } = renderForm();
    expect(screen.getByText('0 of 1 seats in use')).toBeInTheDocument();
    fill('Licence', 'Figma');
    fill('Vendor', 'Figma Inc');
    fill('Seats bought', '3');
    fill('Cost per cycle', '120');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Figma',
          vendor: 'Figma Inc',
          seatsTotal: 3,
          assigneeIds: [],
          cost: 120,
          billingCycle: LicenceBillingCycle.Yearly,
          renewalDate: expect.any(String),
          status: LicenceStatus.Active,
          notes: '',
        },
      },
    });
    expect(await screen.findByText('Licence created')).toBeInTheDocument();
  });

  it('names the seat holders and counts a single held seat in the singular', () => {
    gql.assignees.mockReturnValue({ data: { listAssetAssignees: people } });
    renderForm(licenceRow({ assigneeIds: ['u1'], seatsTotal: 5 }));

    expect(screen.getByText('Asha Rao (asha@exyconn.test)')).toBeInTheDocument();
    expect(screen.getByText('1 of 5 seat in use')).toBeInTheDocument();
  });

  it('refuses fewer seats than people already assigned', async () => {
    gql.assignees.mockReturnValue({ data: { listAssetAssignees: people } });
    renderForm(licenceRow({ assigneeIds: ['u1', 'u2'], seatsTotal: 2 }));
    fill('Seats bought', '');
    expect(screen.getByText('2 of 0 seats in use')).toBeInTheDocument();
    fill('Seats bought', '1');

    await press('Update');

    expect(
      await screen.findByText('More people are assigned than this licence has seats'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('updates an existing licence by id', async () => {
    const { onDone } = renderForm(licenceRow({ id: 'licence-4', notes: 'Team plan' }));

    expect(screen.getByLabelText('Licence')).toHaveValue('Figma');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'licence-4',
        input: expect.objectContaining({ name: 'Figma', seatsTotal: 5, notes: 'Team plan' }),
      },
    });
    expect(await screen.findByText('Licence updated')).toBeInTheDocument();
  });

  it('keeps the form open and shows why a save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Seat limit reached'));
    const { onDone } = renderForm(licenceRow());

    await press('Update');

    expect(await screen.findByText('Seat limit reached')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
