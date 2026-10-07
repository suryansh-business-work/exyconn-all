import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { GatewayMode } from '@exyconn/shell/graphql/generated';
import {
  PayoneerConfigForm,
  type PayoneerConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/payoneer-config';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fakeSecret,
  fill,
  formCallbacks,
  pickOption,
  press,
  toast,
} from '../form.helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreatePayoneerConfigMutation: () => [gql.create],
  useUpdatePayoneerConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const TOKEN = fakeSecret('po', 14);
const MODE = /^Mode/;
const ACTIVE = /^Set as active/;
const TOO_LONG = 'x'.repeat(81);

const stored = (overrides: Partial<PayoneerConfigRow> = {}): PayoneerConfigRow => ({
  id: 'po-1',
  label: 'Checkout',
  merchantCode: 'EXYCONN',
  hasApiToken: true,
  apiTokenHint: 't0k3',
  division: 'EU',
  mode: GatewayMode.Live,
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
  ...overrides,
});

const renderForm = (initial: PayoneerConfigRow | null = null) =>
  renderWithProviders(
    <PayoneerConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('PayoneerConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('starts a new account in sandbox, active, with no division', () => {
    renderForm();
    expect(screen.getByRole('combobox', { name: MODE })).toHaveTextContent(
      'Sandbox (test payments)',
    );
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
    expect(screen.getByLabelText('Division')).toHaveValue('');
    expect(screen.getByText('Shown once, when the token is generated')).toBeInTheDocument();
  });

  it('asks for the label, merchant code and token', async () => {
    renderForm();
    await press('Create');
    await expectMessages('Label is required', 'Merchant code is required', 'API token is required');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('caps the text fields at 80 characters and the token at a sane length', async () => {
    renderForm();
    fill('Label', TOO_LONG);
    fill('Merchant code', TOO_LONG);
    fill('Division', TOO_LONG);
    fill('API token', 'short');
    await press('Create');
    await expectMessages(
      'Keep the label short',
      'Check the merchant code',
      'Check the division',
      'API token must be at least 12 characters',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a live account with no division', async () => {
    renderForm();
    fill('Label', 'Checkout');
    fill('Merchant code', 'EXYCONN');
    fill('API token', TOKEN);
    await pickOption(MODE, 'Live (real money)');
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Checkout',
          merchantCode: 'EXYCONN',
          apiToken: TOKEN,
          division: '',
          mode: GatewayMode.Live,
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Payoneer account created');
  });

  it('edits a live account, keeping its token, and can deactivate it', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: MODE })).toHaveTextContent('Live (real money)');
    await pickOption(ACTIVE, 'No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'po-1',
        input: {
          label: 'Checkout',
          merchantCode: 'EXYCONN',
          apiToken: '',
          division: 'EU',
          mode: GatewayMode.Live,
          isActive: false,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Payoneer account updated');
  });

  it('reads an inactive account back as inactive', () => {
    renderForm(stored({ isActive: false }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('Payoneer rejected the token'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Payoneer rejected the token');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
