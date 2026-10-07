import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { countryName } from '@exyconn/i18n';
import {
  useCreateLeavePolicyMutation,
  useUpdateLeavePolicyMutation,
} from '@exyconn/shell/graphql/generated';
import {
  LeavePolicyForm,
  type LeavePolicyRow,
} from '../../../../../src/pages/leave-policies/forms/leave-policy';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../../harness/gql-doubles';
import { fillField, press } from '../../../harness/form-fields';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateLeavePolicyMutation: vi.fn(),
  useUpdateLeavePolicyMutation: vi.fn(),
}));

const create = vi.fn();
const update = vi.fn();
const INDIA = countryName('IN', 'en');
const QUOTA = 'Annual quota (days)';
const CAP = 'Carry-forward cap';

const policy: LeavePolicyRow = {
  id: 'policy-1',
  name: 'Earned leave',
  code: 'EL',
  annualQuota: 18,
  paid: true,
  halfDayAllowed: true,
  carryForwardCap: 6,
  active: true,
  overrides: [{ country: 'IN', annualQuota: 21, carryForwardCap: 5, active: false }],
};

/** The `index`-th number field labelled `label` (the global one is first, then each row's). */
function setNumberAt(label: string, index: number, value: string) {
  const field = screen.getAllByRole('spinbutton', { name: label })[index];
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

/** Picks a country in the `index`-th override row by typing part of its name. */
async function chooseCountry(index: number, name: string) {
  const input = screen.getAllByRole('combobox', { name: 'Country' })[index];
  await userEvent.click(input);
  await userEvent.paste(name);
  await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name }));
}

function renderForm(initial: LeavePolicyRow | null) {
  const onDone = vi.fn();
  renderWithProviders(<LeavePolicyForm initial={initial} onDone={onDone} onCancel={vi.fn()} />);
  return onDone;
}

beforeEach(() => {
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreateLeavePolicyMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdateLeavePolicyMutation).mockReturnValue(mutationTuple(update) as never);
});

describe('LeavePolicyForm — global terms', () => {
  it('creates a leave type from its global terms, with no overrides', async () => {
    const onDone = renderForm(null);
    await fillField('Name', 'Sick leave');
    await fillField('Code', 'SICK');
    setNumberAt(QUOTA, 0, '12');
    setNumberAt(CAP, 0, '3');
    await userEvent.click(screen.getByLabelText('Paid leave'));
    await press('Create');

    expect(await screen.findByText('LeavePolicy created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Sick leave',
          code: 'SICK',
          annualQuota: 12,
          carryForwardCap: 3,
          paid: true,
          halfDayAllowed: false,
          active: false,
          overrides: [],
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('needs a name, a code and quotas of zero or more', async () => {
    renderForm(null);
    setNumberAt(QUOTA, 0, '-1');
    setNumberAt(CAP, 0, '-2');
    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Code is required')).toBeInTheDocument();
    expect(screen.getAllByText('Must be ≥ 0')).toHaveLength(2);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('LeavePolicyForm — country overrides', () => {
  it('adds a country with its own terms, offered by default', async () => {
    renderForm(null);
    await fillField('Name', 'Sick leave');
    await fillField('Code', 'SICK');
    await press('Add country override');
    await chooseCountry(0, INDIA);
    setNumberAt(QUOTA, 1, '20');
    expect(screen.getByLabelText('Offered')).toBeChecked();
    await press('Create');

    await screen.findByText('LeavePolicy created');
    expect(create.mock.calls[0][0].variables.input.overrides).toEqual([
      { country: 'IN', annualQuota: 20, carryForwardCap: 0, active: true },
    ]);
  });

  it('needs a country and whole days on each row', async () => {
    renderForm(null);
    await press('Add country override');
    setNumberAt(CAP, 1, '1.5');
    await press('Create');

    expect(await screen.findByText('Choose a country')).toBeInTheDocument();
    expect(screen.getByText('Whole days only')).toBeInTheDocument();
  });

  it('flags a country listed twice on the repeated row, and lets it be removed', async () => {
    renderForm(null);
    await fillField('Name', 'Sick leave');
    await fillField('Code', 'SICK');
    await press('Add country override');
    await press('Add country override');
    await chooseCountry(0, INDIA);
    await chooseCountry(1, INDIA);
    await press('Create');

    expect(await screen.findByText('This country already has an override')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();

    await press('Remove override 2');
    expect(screen.queryByRole('button', { name: 'Remove override 2' })).not.toBeInTheDocument();
    await press('Create');
    await screen.findByText('LeavePolicy created');
    expect(create.mock.calls[0][0].variables.input.overrides).toHaveLength(1);
  });
});

describe('LeavePolicyForm — editing', () => {
  it('opens on the leave type and its overrides, and updates it by id', async () => {
    const onDone = renderForm(policy);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Earned leave');
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue(INDIA);
    expect(screen.getByLabelText('Offered')).not.toBeChecked();

    await userEvent.click(screen.getByLabelText('Half day allowed'));
    await press('Update');

    expect(await screen.findByText('LeavePolicy updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'policy-1',
        input: {
          name: 'Earned leave',
          code: 'EL',
          annualQuota: 18,
          carryForwardCap: 6,
          paid: true,
          halfDayAllowed: false,
          active: true,
          overrides: [{ country: 'IN', annualQuota: 21, carryForwardCap: 5, active: false }],
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
