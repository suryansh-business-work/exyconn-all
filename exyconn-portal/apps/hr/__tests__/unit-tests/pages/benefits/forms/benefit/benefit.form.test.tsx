import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BenefitKind } from '@exyconn/shell/graphql/generated';
import { BenefitForm, type BenefitRow } from '../../../../../../src/pages/benefits/forms/benefit';
import { renderWithProviders } from '../../../../test-utils';
import {
  USERS,
  chooseOption,
  localIso,
  pickDate,
  pickOption,
  press,
  typeInto,
} from '../../../../harness/forms';

vi.setConfig({ testTimeout: 20_000 });

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), users: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateBenefitMutation: () => [gql.create],
  useUpdateBenefitMutation: () => [gql.update],
  useListUsersQuery: () => gql.users(),
}));

const row: BenefitRow = {
  id: 'benefit-3',
  employeeId: 'user-1',
  kind: BenefitKind.Pf,
  name: 'Provident fund',
  provider: 'EPFO',
  reference: 'PF-991',
  coverage: '12% of basic',
  validFrom: localIso(2026, 0, 1),
  validTo: localIso(2026, 11, 31),
  documentUrl: 'https://files.example.com/pf.pdf',
};

function renderForm(initial: BenefitRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<BenefitForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('BenefitForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({});
    gql.update.mockReset().mockResolvedValue({});
    gql.users.mockReset().mockReturnValue({ data: { listUsers: USERS } });
  });

  it('asks for every required field before creating anything', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Provider is required')).toBeInTheDocument();
    expect(screen.getByText('Reference is required')).toBeInTheDocument();
    expect(screen.getByText('Coverage is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a benefit, trimming text and sending unset dates and link as null', async () => {
    const { onDone } = renderForm();

    await pickOption('Employee', 'Bo Chen (bo@example.com)');
    await chooseOption('Type', 'Insurance');
    await typeInto('Name', '  Health cover ');
    await typeInto('Provider', 'Acme Insurance');
    await typeInto('Reference', 'POL-1');
    await typeInto('Coverage', 'Family');
    pickDate('validFrom', '04/01/2026');
    await press('Create');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: {
            employeeId: 'user-2',
            kind: BenefitKind.Insurance,
            name: 'Health cover',
            provider: 'Acme Insurance',
            reference: 'POL-1',
            coverage: 'Family',
            validFrom: localIso(2026, 3, 1),
            validTo: null,
            documentUrl: null,
          },
        },
      }),
    );
    expect(await screen.findByText('Benefit created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('refuses a document link that is not a full web address', async () => {
    renderForm(row);

    await typeInto('Document link', 'files/pf.pdf');
    await press('Update');

    expect(await screen.findByText('Enter a full URL starting with https://')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('opens an existing benefit filled in and updates it by id', async () => {
    const { onDone } = renderForm(row);

    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue(
      'Asha Rao (asha@example.com)',
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Provident fund');
    await press('Update');

    await waitFor(() =>
      expect(gql.update).toHaveBeenCalledWith({
        variables: {
          id: 'benefit-3',
          input: {
            employeeId: 'user-1',
            kind: BenefitKind.Pf,
            name: 'Provident fund',
            provider: 'EPFO',
            reference: 'PF-991',
            coverage: '12% of basic',
            validFrom: row.validFrom,
            validTo: row.validTo,
            documentUrl: 'https://files.example.com/pf.pdf',
          },
        },
      }),
    );
    expect(await screen.findByText('Benefit updated')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sends a benefit that never had a start date with validFrom as null', async () => {
    renderForm({ ...row, validFrom: '' });

    await press('Update');

    await waitFor(() =>
      expect(gql.update).toHaveBeenCalledWith({
        variables: {
          id: 'benefit-3',
          input: expect.objectContaining({ validFrom: null, validTo: row.validTo }),
        },
      }),
    );
  });

  it('says why the save failed and keeps the form open', async () => {
    gql.update.mockRejectedValueOnce(new Error('That policy number is already used'));
    const { onDone } = renderForm(row);

    await press('Update');

    expect(await screen.findByText('That policy number is already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('offers nobody to pick until the user list has loaded', async () => {
    gql.users.mockReturnValue({ data: undefined });
    renderForm();

    await userEvent.click(screen.getByRole('combobox', { name: 'Employee' }));

    expect(await screen.findByText('No options')).toBeInTheDocument();
  });

  it('hands control back on cancel without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
