import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  GodaddyConfigForm,
  type GodaddyConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/godaddy-config';
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
  useCreateGodaddyConfigMutation: () => [gql.create],
  useUpdateGodaddyConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const KEY = fakeSecret('gd', 16);
const SECRET = fakeSecret('gs', 18);
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<GodaddyConfigRow> = {}): GodaddyConfigRow => ({
  id: 'gd-1',
  label: 'Domains',
  hasApiKey: true,
  apiKeyHint: 'k123',
  hasApiSecret: true,
  isActive: true,
  ...overrides,
});

const renderForm = (initial: GodaddyConfigRow | null = null) =>
  renderWithProviders(
    <GodaddyConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('GodaddyConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('asks for both halves of the credential when creating', async () => {
    renderForm();
    expect(
      screen.getByText('A Production key from developer.godaddy.com/keys'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Shown once, next to the key, when GoDaddy creates it'),
    ).toBeInTheDocument();
    await press('Create');
    await expectMessages('Label is required', 'API key is required', 'API secret is required');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('treats a key or secret under 16 characters as a paste error', async () => {
    renderForm();
    fill('Label', 'Domains');
    fill('API key', 'short-key');
    fill('API secret', 'short-secret');
    await press('Create');
    await expectMessages(
      'API key must be at least 16 characters',
      'API secret must be at least 16 characters',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active credential', async () => {
    renderForm();
    fill('Label', 'Domains');
    fill('API key', KEY);
    fill('API secret', SECRET);
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { label: 'Domains', apiKey: KEY, apiSecret: SECRET, isActive: true } },
    });
    expect(await toast()).toHaveTextContent('GoDaddy config created');
  });

  it('keeps both stored halves when an edit leaves them blank', async () => {
    renderForm(stored());
    expect(screen.getAllByText('Leave blank to keep the current value')).toHaveLength(2);
    await pickOption(ACTIVE, 'No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'gd-1',
        input: { label: 'Domains', apiKey: '', apiSecret: '', isActive: false },
      },
    });
    expect(await toast()).toHaveTextContent('GoDaddy config updated');
  });

  it('starts an inactive credential as inactive', async () => {
    renderForm(stored({ isActive: false }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update.mock.calls[0][0].variables.input.isActive).toBe(false);
  });

  it('reports a failed save', async () => {
    gql.create.mockRejectedValue(new Error('GoDaddy refused the key'));
    renderForm();
    fill('Label', 'Domains');
    fill('API key', KEY);
    fill('API secret', SECRET);
    await press('Create');
    expect(await toast()).toHaveTextContent('GoDaddy refused the key');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
