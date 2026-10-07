import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  RazorpayConfigForm,
  type RazorpayConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/razorpay-config';
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
  useCreateRazorpayConfigMutation: () => [gql.create],
  useUpdateRazorpayConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const KEY_ID = fakeSecret('rzp_test_', 14);
const KEY_SECRET = fakeSecret('ks', 14);
const WEBHOOK_SECRET = fakeSecret('wh', 14);
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<RazorpayConfigRow> = {}): RazorpayConfigRow => ({
  id: 'rz-1',
  label: 'UPI',
  keyId: KEY_ID,
  hasKeySecret: true,
  keySecretHint: 'k9k9',
  hasWebhookSecret: true,
  webhookSecretHint: 'w8w8',
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
  ...overrides,
});

const renderForm = (initial: RazorpayConfigRow | null = null) =>
  renderWithProviders(
    <RazorpayConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('RazorpayConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('tells a new account where Razorpay must post its webhooks', () => {
    renderForm();
    expect(
      screen.getByText(/\/webhooks\/razorpay \(payment_link\.\* events\)/),
    ).toBeInTheDocument();
    expect(screen.getByText('Shown once, when the key is generated')).toBeInTheDocument();
  });

  it('asks for the label, a proper key id and both secrets', async () => {
    renderForm();
    await press('Create');
    await expectMessages(
      'Label is required',
      'A Razorpay key id starts with rzp_live_ or rzp_test_',
      'Key secret is required',
      'Webhook secret is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('treats short secrets and a long label as mistakes', async () => {
    renderForm();
    fill('Label', 'x'.repeat(81));
    fill('Key id', KEY_ID);
    fill('Key secret', 'short');
    fill('Webhook secret', 'tiny');
    await press('Create');
    await expectMessages(
      'Keep the label short',
      'Key secret must be at least 12 characters',
      'Webhook secret must be at least 12 characters',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active account', async () => {
    renderForm();
    fill('Label', 'UPI');
    fill('Key id', KEY_ID);
    fill('Key secret', KEY_SECRET);
    fill('Webhook secret', WEBHOOK_SECRET);
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'UPI',
          keyId: KEY_ID,
          keySecret: KEY_SECRET,
          webhookSecret: WEBHOOK_SECRET,
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Razorpay account created');
  });

  it('edits an account, keeping both secrets when blank', async () => {
    renderForm(stored());
    expect(screen.getAllByText('Leave blank to keep the current value')).toHaveLength(2);
    await pickOption(ACTIVE, 'No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'rz-1',
        input: { label: 'UPI', keyId: KEY_ID, keySecret: '', webhookSecret: '', isActive: false },
      },
    });
    expect(await toast()).toHaveTextContent('Razorpay account updated');
  });

  it('reads an inactive account back as inactive', () => {
    renderForm(stored({ isActive: false }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('Razorpay rejected the key'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Razorpay rejected the key');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
