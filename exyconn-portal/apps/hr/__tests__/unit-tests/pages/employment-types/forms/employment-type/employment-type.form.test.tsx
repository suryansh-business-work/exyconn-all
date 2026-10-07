import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EmploymentTypeForm,
  type EmploymentTypeRow,
} from '../../../../../../src/pages/employment-types/forms/employment-type';
import { renderWithProviders } from '../../../../test-utils';
import { press, typeInto } from '../../../../harness/forms';

vi.setConfig({ testTimeout: 20_000 });

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateEmploymentTypeMutation: () => [gql.create],
  useUpdateEmploymentTypeMutation: () => [gql.update],
}));

const row: EmploymentTypeRow = {
  id: 'type-2',
  name: 'Contract',
  code: 'CT',
  description: 'Fixed term',
  payrollEligible: false,
  active: true,
};

function renderForm(initial: EmploymentTypeRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<EmploymentTypeForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('EmploymentTypeForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({});
    gql.update.mockReset().mockResolvedValue({});
  });

  it('asks for a name and a code', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Code is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('starts a new type switched off and creates it with the flags turned on', async () => {
    const { onDone } = renderForm();

    expect(screen.getByLabelText('Payroll eligible')).not.toBeChecked();
    expect(screen.getByLabelText('Active')).not.toBeChecked();
    await typeInto('Name', 'Full time');
    await typeInto('Code', ' FT ');
    await userEvent.click(screen.getByLabelText('Payroll eligible'));
    await userEvent.click(screen.getByLabelText('Active'));
    await press('Create');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'Full time',
            code: 'FT',
            description: '',
            payrollEligible: true,
            active: true,
          },
        },
      }),
    );
    expect(await screen.findByText('EmploymentType created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('updates an existing type by id, keeping its description and flags', async () => {
    renderForm(row);

    expect(screen.getByLabelText('Active')).toBeChecked();
    await typeInto('Description', 'Fixed term, renewable');
    await press('Update');

    await waitFor(() =>
      expect(gql.update).toHaveBeenCalledWith({
        variables: {
          id: 'type-2',
          input: {
            name: 'Contract',
            code: 'CT',
            description: 'Fixed term, renewable',
            payrollEligible: false,
            active: true,
          },
        },
      }),
    );
    expect(await screen.findByText('EmploymentType updated')).toBeInTheDocument();
  });

  it('says why the save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Code CT is taken'));
    const { onDone } = renderForm(row);

    await press('Update');

    expect(await screen.findByText('Code CT is taken')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on cancel', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
