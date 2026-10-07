import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useCreateLocationMutation,
  useUpdateLocationMutation,
} from '@exyconn/shell/graphql/generated';
import { LocationForm, type LocationRow } from '../../../../../src/pages/locations/forms/location';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../../harness/gql-doubles';
import { fillField, press } from '../../../harness/form-fields';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateLocationMutation: vi.fn(),
  useUpdateLocationMutation: vi.fn(),
}));

const create = vi.fn();
const update = vi.fn();

const office: LocationRow = {
  id: 'loc-1',
  name: 'Bengaluru office',
  code: 'BLR',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  timezone: 'Asia/Kolkata',
  address: '1 MG Road',
  active: true,
};

function renderForm(initial: LocationRow | null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<LocationForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

beforeEach(() => {
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreateLocationMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdateLocationMutation).mockReturnValue(mutationTuple(update) as never);
});

describe('LocationForm', () => {
  it('creates an inactive location from the required fields, trimmed', async () => {
    const { onDone } = renderForm(null);
    expect(screen.getByLabelText('Active')).not.toBeChecked();
    await fillField('Name', ' Pune studio ');
    await fillField('Code', 'PNQ');
    await fillField('Timezone', 'Asia/Kolkata');
    await press('Create');

    expect(await screen.findByText('Location created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Pune studio',
          code: 'PNQ',
          city: '',
          state: '',
          country: '',
          timezone: 'Asia/Kolkata',
          address: '',
          active: false,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('needs a name, a code and a timezone', async () => {
    renderForm(null);
    await press('Create');
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Code is required')).toBeInTheDocument();
    expect(screen.getByText('Timezone is required')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('opens on the location and updates it by id', async () => {
    const { onDone } = renderForm(office);
    expect(screen.getByRole('textbox', { name: 'Address' })).toHaveValue('1 MG Road');
    await fillField('City', 'Bangalore');
    await userEvent.click(screen.getByLabelText('Active'));
    await press('Update');

    expect(await screen.findByText('Location updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'loc-1',
        input: {
          name: 'Bengaluru office',
          code: 'BLR',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          timezone: 'Asia/Kolkata',
          address: '1 MG Road',
          active: false,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('says why a save failed, and cancels without saving', async () => {
    update.mockRejectedValueOnce(new Error('Code already in use'));
    const { onDone, onCancel } = renderForm(office);
    await press('Update');
    expect(await screen.findByText('Code already in use')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
