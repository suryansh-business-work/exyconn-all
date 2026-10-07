import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  OpenAiConfigForm,
  type OpenAiConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/openai-config';
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
  useCreateOpenAiConfigMutation: () => [gql.create],
  useUpdateOpenAiConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const KEY = fakeSecret('sk-', 24);
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<OpenAiConfigRow> = {}): OpenAiConfigRow => ({
  id: 'ai-1',
  label: 'Default',
  hasApiKey: true,
  apiKeyHint: 'q1w2',
  defaultModel: 'gpt-4o-mini',
  isActive: true,
  ...overrides,
});

const renderForm = (initial: OpenAiConfigRow | null = null) =>
  renderWithProviders(
    <OpenAiConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('OpenAiConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('asks for a label, a key and a model when creating', async () => {
    renderForm();
    expect(screen.getByText('A secret key from platform.openai.com/api-keys')).toBeInTheDocument();
    await press('Create');
    await expectMessages('Label is required', 'API key is required', 'Model is required');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a key without the sk- prefix', async () => {
    renderForm();
    fill('Label', 'Default');
    fill('API key', fakeSecret('pk-', 24));
    fill('Model', 'gpt-4o-mini');
    await press('Create');
    await expectMessages('API key must start with "sk-"');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active key with its default model', async () => {
    renderForm();
    fill('Label', 'Default');
    fill('API key', KEY);
    fill('Model', 'gpt-4o-mini');
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: { label: 'Default', apiKey: KEY, defaultModel: 'gpt-4o-mini', isActive: true },
      },
    });
    expect(await toast()).toHaveTextContent('OpenAI config created');
  });

  it('changes the model of a stored key without resending the key', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    fill('Model', 'gpt-4.1');
    await pickOption(ACTIVE, 'No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'ai-1',
        input: { label: 'Default', apiKey: '', defaultModel: 'gpt-4.1', isActive: false },
      },
    });
    expect(await toast()).toHaveTextContent('OpenAI config updated');
  });

  it('reads an inactive key back as inactive', async () => {
    renderForm(stored({ isActive: false }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('The model is not available to this key'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('The model is not available to this key');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
