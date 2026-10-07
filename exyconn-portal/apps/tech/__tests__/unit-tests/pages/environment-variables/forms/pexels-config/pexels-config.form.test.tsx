import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  PexelsConfigForm,
  type PexelsConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/pexels-config';
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
  useCreatePexelsConfigMutation: () => [gql.create],
  useUpdatePexelsConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const KEY = fakeSecret('', 32);
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<PexelsConfigRow> = {}): PexelsConfigRow => ({
  id: 'px-1',
  label: 'Stock media',
  hasApiKey: true,
  apiKeyHint: 'a1a1',
  isActive: true,
  ...overrides,
});

const renderForm = (initial: PexelsConfigRow | null = null) =>
  renderWithProviders(
    <PexelsConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('PexelsConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('asks for a label and a key when creating', async () => {
    renderForm();
    expect(screen.getByText(/one key covers both photo and video search/)).toBeInTheDocument();
    await press('Create');
    await expectMessages('Label is required', 'API key is required');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a key shorter than 32 characters', async () => {
    renderForm();
    fill('Label', 'Stock media');
    fill('API key', fakeSecret('', 31));
    await press('Create');
    await expectMessages('API key must be at least 32 characters');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active key', async () => {
    renderForm();
    fill('Label', 'Stock media');
    fill('API key', KEY);
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { label: 'Stock media', apiKey: KEY, isActive: true } },
    });
    expect(await toast()).toHaveTextContent('Pexels config created');
  });

  it('renames a stored key without resending it and can deactivate it', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    fill('Label', 'Pexels');
    await pickOption(ACTIVE, 'No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'px-1', input: { label: 'Pexels', apiKey: '', isActive: false } },
    });
    expect(await toast()).toHaveTextContent('Pexels config updated');
  });

  it('reads an inactive key back as inactive', () => {
    renderForm(stored({ isActive: false }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('Pexels rejected the key'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Pexels rejected the key');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
