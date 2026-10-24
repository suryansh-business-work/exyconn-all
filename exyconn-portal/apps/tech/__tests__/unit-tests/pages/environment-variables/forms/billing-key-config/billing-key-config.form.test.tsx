import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechSecret } from '@exyconn/shell/graphql/generated';
import {
  BillingKeyConfigForm,
  type BillingKeyConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/billing-key-config';
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

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), revealAll: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateBillingKeyConfigMutation: () => [gql.create],
  useUpdateBillingKeyConfigMutation: () => [gql.update],
  useRevealAllTechSecretsMutation: () => [gql.revealAll],
}));

const cb = formCallbacks();
const KEY = fakeSecret('sk-admin-', 40);

const stored = (overrides: Partial<BillingKeyConfigRow> = {}): BillingKeyConfigRow => ({
  id: 'bk-1',
  provider: 'OPENAI' as BillingKeyConfigRow['provider'],
  label: 'Billing',
  hasKey: true,
  keyHint: 'Wx9z',
  isActive: true,
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

const renderForm = (initial: BillingKeyConfigRow | null = null) =>
  renderWithProviders(
    <BillingKeyConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('BillingKeyConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.revealAll.mockReset();
    cb.reset();
  });

  it('needs a label and a key for a new billing key, at most 100 characters of label', async () => {
    renderForm();
    await press('Create');
    await expectMessages('Label is required', 'The billing key is required');
    fill('Label', 'L'.repeat(101));
    fill('Billing key', 'k'.repeat(501));
    await press('Create');
    await expectMessages('At most 100 characters', 'At most 500 characters');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active OpenAI billing key', async () => {
    renderForm();
    fill('Label', 'Billing');
    fill('Billing key', KEY);
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { provider: 'OPENAI', label: 'Billing', key: KEY, isActive: true } },
    });
    expect(await toast()).toHaveTextContent('Billing key created');
  });

  it('keeps the stored key on a blank edit, and keeps an inactive key inactive', async () => {
    renderForm(stored({ isActive: false }));
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'bk-1',
        input: { provider: 'OPENAI', label: 'Billing', key: '', isActive: false },
      },
    });
  });

  it('shows the saved key from the page memory on the eye button', async () => {
    gql.revealAll.mockResolvedValue({
      data: { revealAllTechSecrets: [{ secret: TechSecret.BillingKey, id: 'bk-1', value: KEY }] },
    });
    renderForm(stored());
    await userEvent.click(screen.getByRole('button', { name: /show/i }));
    expect(await screen.findByDisplayValue(KEY)).toBeInTheDocument();
  });

  it('can be made inactive when created, and reports a failed save', async () => {
    gql.create.mockRejectedValue(new Error('Not allowed'));
    renderForm();
    fill('Label', 'Billing');
    fill('Billing key', KEY);
    await pickOption(/^Set as active/, 'No');
    await press('Create');
    expect(await toast()).toHaveTextContent('Not allowed');
    expect(gql.create.mock.calls[0][0].variables.input.isActive).toBe(false);
    expect(cb.onDone).not.toHaveBeenCalled();
  });
});
