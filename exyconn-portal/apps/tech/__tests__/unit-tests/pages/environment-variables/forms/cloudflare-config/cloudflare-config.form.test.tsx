import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  CloudflareConfigForm,
  type CloudflareConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/cloudflare-config';
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
  useCreateCloudflareConfigMutation: () => [gql.create],
  useUpdateCloudflareConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const TOKEN = fakeSecret('cf', 40);
const ACCOUNT = 'abcdef0123456789abcdef0123456789';

const stored = (overrides: Partial<CloudflareConfigRow> = {}): CloudflareConfigRow => ({
  id: 'cf-1',
  label: 'Primary',
  accountId: ACCOUNT,
  hasApiToken: true,
  apiTokenHint: 'wxyz',
  isActive: true,
  ...overrides,
});

const renderForm = (initial: CloudflareConfigRow | null = null) =>
  renderWithProviders(
    <CloudflareConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('CloudflareConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('asks for a label, a token and the account when creating', async () => {
    renderForm();
    expect(screen.getByText(/Zone:Read, Zone:Edit and DNS:Edit/)).toBeInTheDocument();
    await press('Create');
    await expectMessages('Label is required', 'API token is required', 'Account ID is required');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a short token and an account id that is not 32 hex characters', async () => {
    renderForm();
    fill('Label', 'Primary');
    fill('API token', fakeSecret('cf', 30));
    fill('Account ID', 'not-an-account');
    await press('Create');
    await expectMessages(
      'API token must be at least 40 characters',
      'Account ID is 32 letters and digits (a–f, 0–9)',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active credential', async () => {
    renderForm();
    fill('Label', 'Primary');
    fill('API token', TOKEN);
    fill('Account ID', ACCOUNT);
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: { label: 'Primary', apiToken: TOKEN, accountId: ACCOUNT, isActive: true },
      },
    });
    expect(await toast()).toHaveTextContent('Cloudflare config created');
  });

  it('keeps the stored token when an edit leaves it blank', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    expect(screen.getByLabelText('Account ID')).toHaveValue(ACCOUNT);
    await pickOption(/^Set as active/, 'No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'cf-1',
        input: { label: 'Primary', apiToken: '', accountId: ACCOUNT, isActive: false },
      },
    });
    expect(await toast()).toHaveTextContent('Cloudflare config updated');
  });

  it('still checks a replacement token typed on an edit', async () => {
    renderForm(stored());
    fill('API token', 'short');
    await press('Update');
    await expectMessages('API token must be at least 40 characters');
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('keeps an inactive credential inactive', async () => {
    renderForm(stored({ isActive: false }));
    expect(screen.getByRole('combobox', { name: /^Set as active/ })).toHaveTextContent('No');
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update.mock.calls[0][0].variables.input.isActive).toBe(false);
  });

  it('reports a failed save and stays open', async () => {
    gql.update.mockRejectedValue(new Error('Cloudflare rejected the token'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Cloudflare rejected the token');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
