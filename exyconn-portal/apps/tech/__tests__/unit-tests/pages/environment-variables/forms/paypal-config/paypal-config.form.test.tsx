import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { GatewayMode } from '@exyconn/shell/graphql/generated';
import {
  PaypalConfigForm,
  type PaypalConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/paypal-config';
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
  useCreatePaypalConfigMutation: () => [gql.create],
  useUpdatePaypalConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const CLIENT_ID = fakeSecret('AX', 24);
const CLIENT_SECRET = fakeSecret('EK', 24);
const MODE = /^Mode/;
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<PaypalConfigRow> = {}): PaypalConfigRow => ({
  id: 'pp-1',
  label: 'PayPal',
  clientId: CLIENT_ID,
  hasClientSecret: true,
  clientSecretHint: 'sec1',
  webhookId: 'WH-123',
  mode: GatewayMode.Sandbox,
  isActive: false,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
  ...overrides,
});

const renderForm = (initial: PaypalConfigRow | null = null) =>
  renderWithProviders(
    <PaypalConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('PaypalConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('asks for every credential when creating', async () => {
    renderForm();
    expect(screen.getByRole('combobox', { name: MODE })).toHaveTextContent(
      'Sandbox (test payments)',
    );
    expect(screen.getByText('Shown under the client id in the same app')).toBeInTheDocument();
    await press('Create');
    await expectMessages(
      'Label is required',
      'Client id is required',
      'Client secret is required',
      'Webhook id is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('treats short keys and overlong names as mistakes', async () => {
    renderForm();
    fill('Label', 'x'.repeat(81));
    fill('Client id', 'AX123');
    fill('Client secret', 'EK123');
    fill('Webhook id', 'W'.repeat(81));
    await press('Create');
    await expectMessages(
      'Keep the label short',
      'Client id must be at least 20 characters',
      'Client secret must be at least 20 characters',
      'Check the webhook id',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a live account', async () => {
    renderForm();
    fill('Label', 'PayPal');
    fill('Client id', CLIENT_ID);
    fill('Client secret', CLIENT_SECRET);
    fill('Webhook id', 'WH-123');
    await pickOption(MODE, 'Live (real money)');
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'PayPal',
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          webhookId: 'WH-123',
          mode: GatewayMode.Live,
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('PayPal account created');
  });

  it('edits an inactive sandbox account, keeping its secret when blank', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'pp-1',
        input: {
          label: 'PayPal',
          clientId: CLIENT_ID,
          clientSecret: '',
          webhookId: 'WH-123',
          mode: GatewayMode.Sandbox,
          isActive: false,
        },
      },
    });
    expect(await toast()).toHaveTextContent('PayPal account updated');
  });

  it('reads an active account back as active', () => {
    renderForm(stored({ isActive: true }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('PayPal rejected the credentials'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('PayPal rejected the credentials');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
