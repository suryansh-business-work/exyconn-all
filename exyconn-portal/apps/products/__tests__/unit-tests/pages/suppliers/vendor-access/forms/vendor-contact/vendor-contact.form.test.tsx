import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  VendorContactForm,
  vendorContactSchema,
} from '../../../../../../../src/pages/suppliers/vendor-access/forms/vendor-contact';
import { renderWithProviders } from '../../../../../test-utils';
import { fillField, press } from '../../../../../form-helpers';

const gql = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAddVendorContactMutation: () => [gql.add],
}));

function renderForm() {
  const onAdded = vi.fn();
  renderWithProviders(<VendorContactForm supplierId="supplier-3" onAdded={onAdded} />);
  return { onAdded };
}

const field = (label: string) => screen.getByLabelText<HTMLInputElement>(new RegExp(`^${label}`));

describe('vendorContactSchema', () => {
  it('trims both fields and caps the name at 120 characters', () => {
    expect(vendorContactSchema.parse({ name: ' Sam ', email: ' sam@acme.test ' })).toEqual({
      name: 'Sam',
      email: 'sam@acme.test',
    });
    expect(
      vendorContactSchema.safeParse({ name: 'x'.repeat(121), email: 'sam@acme.test' }).success,
    ).toBe(false);
  });
});

describe('VendorContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.add.mockResolvedValue({
      data: { addVendorContact: { id: 'vc-9', email: 'sam@acme.test' } },
    });
  });

  it('needs a name and an email', async () => {
    renderForm();

    await press('Give access');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(gql.add).not.toHaveBeenCalled();
  });

  it('refuses something that is not an email address', async () => {
    renderForm();
    await fillField('Name', 'Sam Lee');
    await fillField('Email', 'sam-at-acme');

    await press('Give access');

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(gql.add).not.toHaveBeenCalled();
  });

  it('refuses a name over 120 characters', async () => {
    renderForm();
    await fillField('Name', 'x'.repeat(121));
    await fillField('Email', 'sam@acme.test');

    await press('Give access');

    expect(await screen.findByText('Keep the name under 120 characters')).toBeInTheDocument();
    expect(gql.add).not.toHaveBeenCalled();
  });

  it('gives access for this supplier, says who was emailed and clears the form', async () => {
    const { onAdded } = renderForm();
    await fillField('Name', ' Sam Lee ');
    await fillField('Email', 'sam@acme.test');

    await press('Give access');

    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1));
    expect(gql.add).toHaveBeenCalledWith({
      variables: { input: { supplierId: 'supplier-3', name: 'Sam Lee', email: 'sam@acme.test' } },
    });
    expect(await screen.findByText('Access given — sam@acme.test has been emailed')).toBeVisible();
    expect(field('Name').value).toBe('');
    expect(field('Email').value).toBe('');
  });

  it('shows the server refusal and keeps what was typed', async () => {
    gql.add.mockRejectedValueOnce(new Error('That email already has vendor portal access.'));
    const { onAdded } = renderForm();
    await fillField('Name', 'Sam Lee');
    await fillField('Email', 'sam@acme.test');

    await press('Give access');

    expect(await screen.findByText('That email already has vendor portal access.')).toBeVisible();
    expect(onAdded).not.toHaveBeenCalled();
    expect(field('Email').value).toBe('sam@acme.test');
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.add.mockRejectedValueOnce('offline');
    renderForm();
    await fillField('Name', 'Sam Lee');
    await fillField('Email', 'sam@acme.test');

    await press('Give access');

    expect(await screen.findByText('Could not give access')).toBeVisible();
  });
});
