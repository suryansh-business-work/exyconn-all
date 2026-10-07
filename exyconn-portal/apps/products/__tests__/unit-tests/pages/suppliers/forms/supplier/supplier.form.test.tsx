import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SupplierStatus } from '@exyconn/shell/graphql/generated';
import {
  SupplierForm,
  type SupplierRow,
} from '../../../../../../src/pages/suppliers/forms/supplier';
import { renderWithProviders } from '../../../../test-utils';
import { supplierRow } from '../../../../fixtures';
import { chooseOption, fillField, optionsOf, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateSupplierMutation: () => [gql.create],
  useUpdateSupplierMutation: () => [gql.update],
}));

function renderForm(initial: SupplierRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<SupplierForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('SupplierForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createSupplier: { id: 'supplier-9' } } });
    gql.update.mockResolvedValue({ data: { updateSupplier: { id: 'supplier-1' } } });
  });

  it('requires a name and a code of at least two characters', async () => {
    renderForm();
    await fillField('Code', 'A');

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Code is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the code short and free of spaces or symbols', async () => {
    renderForm();
    await fillField('Supplier name', 'Globex Parts');
    await fillField('Code', 'GLOBEX-PARTS-1');

    await press('Create');
    expect(
      await screen.findByText('Keep the code short — it goes on purchase orders'),
    ).toBeInTheDocument();

    await fillField('Code', 'GL OB');
    expect(await screen.findByText('Use letters, digits and dashes only')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('checks an email and a phone number only when one is given', async () => {
    renderForm();
    await fillField('Supplier name', 'Globex Parts');
    await fillField('Code', 'GLX');
    await fillField('Email', 'not-an-email');
    await fillField('Phone', '12');

    await press('Create');

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers every supplier status in words', async () => {
    renderForm();

    expect(await optionsOf('Status')).toEqual(['Active', 'Inactive', 'On Hold']);
  });

  it('creates an active supplier with the code upper-cased and the blanks left empty', async () => {
    const { onDone } = renderForm();
    await fillField('Supplier name', '  Globex Parts ');
    await fillField('Code', 'glx-01');
    await fillField('Contact', 'Meera');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Globex Parts',
          code: 'GLX-01',
          contactName: 'Meera',
          email: '',
          phone: '',
          status: SupplierStatus.Active,
          notes: '',
        },
      },
    });
    expect(await screen.findByText('Supplier created')).toBeInTheDocument();
  });

  it('updates an existing supplier by id with its new status and contact details', async () => {
    const { onDone } = renderForm(supplierRow({ id: 'supplier-1' }));

    expect(screen.getByLabelText('Supplier name')).toHaveValue('Acme Supplies');
    await fillField('Phone', '+91 98765 43210');
    await chooseOption('Status', 'On Hold');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'supplier-1',
        input: {
          name: 'Acme Supplies',
          code: 'ACME-01',
          contactName: 'Ravi',
          email: 'ravi@acme.io',
          phone: '+91 98765 43210',
          status: SupplierStatus.OnHold,
          notes: '',
        },
      },
    });
    expect(await screen.findByText('Supplier updated')).toBeInTheDocument();
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce('offline');
    const { onDone } = renderForm(supplierRow());

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
