import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  StripeConfigForm,
  type StripeConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/stripe-config';
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
  useCreateStripeConfigMutation: () => [gql.create],
  useUpdateStripeConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const SECRET_KEY = fakeSecret('sk_test_', 16);
const WEBHOOK_SECRET = fakeSecret('whsec_', 16);
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<StripeConfigRow> = {}): StripeConfigRow => ({
  id: 'st-1',
  label: 'Cards',
  hasSecretKey: true,
  secretKeyHint: 'abcd',
  hasWebhookSecret: true,
  webhookSecretHint: 'efgh',
  isActive: false,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
  ...overrides,
});

const renderForm = (initial: StripeConfigRow | null = null) =>
  renderWithProviders(
    <StripeConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('StripeConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('tells a new account which endpoint Stripe must call', () => {
    renderForm();
    expect(
      screen.getByText(/\/webhooks\/stripe \(checkout\.session\.\* events\)/),
    ).toBeInTheDocument();
    expect(screen.getByText('Dashboard › Developers › API keys')).toBeInTheDocument();
  });

  it('asks for a label and both secrets when creating', async () => {
    renderForm();
    await press('Create');
    await expectMessages(
      'Label is required',
      'Secret key is required',
      'Webhook signing secret is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a publishable key and a secret that is not a webhook secret', async () => {
    renderForm();
    fill('Label', 'x'.repeat(81));
    fill('Secret key', fakeSecret('pk_test_', 16));
    fill('Webhook signing secret', fakeSecret('sk_test_', 16));
    await press('Create');
    await expectMessages(
      'Keep the label short',
      'A Stripe secret key starts with sk_live_ or sk_test_ (or rk_ for a restricted key)',
      'A Stripe webhook signing secret starts with whsec_',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active account', async () => {
    renderForm();
    fill('Label', 'Cards');
    fill('Secret key', SECRET_KEY);
    fill('Webhook signing secret', WEBHOOK_SECRET);
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Cards',
          secretKey: SECRET_KEY,
          webhookSecret: WEBHOOK_SECRET,
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Stripe account created');
  });

  it('edits an inactive account, keeping both secrets when blank', async () => {
    renderForm(stored());
    expect(screen.getAllByText('Leave blank to keep the current value')).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
    await pickOption(ACTIVE, 'Yes');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'st-1',
        input: { label: 'Cards', secretKey: '', webhookSecret: '', isActive: true },
      },
    });
    expect(await toast()).toHaveTextContent('Stripe account updated');
  });

  it('reads an active account back as active', () => {
    renderForm(stored({ isActive: true }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('Stripe rejected the key'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Stripe rejected the key');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
