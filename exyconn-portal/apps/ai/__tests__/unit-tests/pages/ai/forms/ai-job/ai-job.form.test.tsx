import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiJobStatus } from '@exyconn/shell/graphql/generated';
import { AiJobForm, type AiJobRow } from '../../../../../../src/pages/ai/forms/ai-job';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({
  createAiJob: vi.fn(),
  updateAiJob: vi.fn(),
  models: {
    options: [] as Array<{ value: string; label: string }>,
    defaultModel: '',
    loading: false,
    error: undefined as string | undefined,
  },
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateAiJobMutation: () => [gql.createAiJob],
  useUpdateAiJobMutation: () => [gql.updateAiJob],
}));

vi.mock('../../../../../../src/pages/ai/useAiModels', () => ({
  useAiModels: () => gql.models,
}));

const MODELS = ['gpt-4o', 'gpt-4o-mini'].map((model) => ({ value: model, label: model }));

const ROW: AiJobRow = {
  id: 'job-1',
  name: 'Digest',
  model: 'gpt-4o-mini',
  prompt: 'Summarise the week',
  status: AiJobStatus.Queued,
  totalTokens: 0,
};

const model = () => screen.getByRole('combobox', { name: 'Model' });

function renderForm(initial: AiJobRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <AiJobForm initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { ...view, onDone, onCancel };
}

describe('AiJobForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.models = { options: MODELS, defaultModel: 'gpt-4o', loading: false, error: undefined };
  });

  it('creates a job on the default model, with the text trimmed', async () => {
    const user = userEvent.setup();
    gql.createAiJob.mockResolvedValue({ data: { createAiJob: { id: 'job-2' } } });
    const { onDone } = renderForm();
    await waitFor(() => expect(model()).toHaveValue('gpt-4o'));
    await user.type(screen.getByLabelText('Job name'), '  Digest  ');
    await user.type(screen.getByLabelText('Prompt'), ' Summarise the week ');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.createAiJob).toHaveBeenCalledWith({
      variables: { input: { name: 'Digest', model: 'gpt-4o', prompt: 'Summarise the week' } },
    });
    expect(await screen.findByText('AI job created')).toBeInTheDocument();
  });

  it('says what is missing before anything is sent', async () => {
    const user = userEvent.setup();
    gql.models = { ...gql.models, defaultModel: '' };
    renderForm();
    await user.type(screen.getByLabelText('Prompt'), 'ab');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Pick the model to run this on')).toBeInTheDocument();
    expect(screen.getByText('Add a prompt of at least 3 characters')).toBeInTheDocument();
    expect(gql.createAiJob).not.toHaveBeenCalled();
  });

  it('updates the job being edited and keeps its own model over the default', async () => {
    const user = userEvent.setup();
    gql.updateAiJob.mockResolvedValue({ data: { updateAiJob: { id: 'job-1' } } });
    const { onDone } = renderForm(ROW);
    expect(model()).toHaveValue('gpt-4o-mini');
    await user.clear(screen.getByLabelText('Job name'));
    await user.type(screen.getByLabelText('Job name'), 'Monday digest');
    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.updateAiJob).toHaveBeenCalledWith({
      variables: {
        id: 'job-1',
        input: { name: 'Monday digest', model: 'gpt-4o-mini', prompt: 'Summarise the week' },
      },
    });
    expect(await screen.findByText('AI job updated')).toBeInTheDocument();
  });

  it('picks up the default model when it arrives after the form opened', async () => {
    gql.models = { ...gql.models, defaultModel: '' };
    const { rerender, onDone, onCancel } = renderForm();
    expect(model()).toHaveValue('');
    gql.models = { ...gql.models, defaultModel: 'gpt-4o-mini' };
    rerender(<AiJobForm initial={null} onDone={onDone} onCancel={onCancel} />);
    await waitFor(() => expect(model()).toHaveValue('gpt-4o-mini'));
  });

  it('explains which models are offered, or why there are none', () => {
    const { unmount } = renderForm();
    expect(screen.getByText('Models the active OpenAI key can reach')).toBeInTheDocument();
    unmount();
    gql.models = { options: [], defaultModel: '', loading: false, error: 'No active OpenAI key' };
    renderForm();
    expect(screen.getByText('No active OpenAI key')).toBeInTheDocument();
  });

  it('reports a failed save and keeps the form open', async () => {
    const user = userEvent.setup();
    gql.updateAiJob.mockRejectedValue(new Error('A job with that name exists'));
    const { onDone } = renderForm(ROW);
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(await screen.findByText('A job with that name exists')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.createAiJob).not.toHaveBeenCalled();
  });
});
