import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptCategory } from '@exyconn/shell/graphql/generated';
import {
  RunPromptForm,
  type RunPromptTarget,
} from '../../../../../../src/pages/ai/forms/run-prompt';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({
  runPrompt: vi.fn(),
  models: {
    options: [] as Array<{ value: string; label: string }>,
    defaultModel: '',
    loading: false,
    error: undefined as string | undefined,
  },
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useRunPromptMutation: () => [gql.runPrompt],
}));

vi.mock('../../../../../../src/pages/ai/useAiModels', () => ({
  useAiModels: () => gql.models,
}));

const MODELS = ['gpt-4o', 'gpt-4o-mini'].map((model) => ({ value: model, label: model }));

const PROMPT: RunPromptTarget = {
  id: 'prompt-1',
  title: 'Outreach',
  category: PromptCategory.Marketing,
  content: 'Write to {{company}} about {{product}}',
  description: null,
  tags: [],
  variables: ['company', 'product'],
};

const model = () => screen.getByRole('combobox', { name: 'Model' });
const runButton = () => screen.getByRole('button', { name: 'Run' });

function renderForm(prompt: RunPromptTarget = PROMPT) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <RunPromptForm prompt={prompt} onDone={onDone} onCancel={onCancel} />,
  );
  return { ...view, onDone, onCancel };
}

describe('RunPromptForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.models = { options: MODELS, defaultModel: 'gpt-4o', loading: false, error: undefined };
  });

  it('previews the prompt, filling each placeholder as it is typed', async () => {
    const user = userEvent.setup();
    renderForm();
    expect(screen.getByText('Write to {{company}} about {{product}}')).toBeInTheDocument();
    await user.type(screen.getByLabelText('company'), 'Acme');
    expect(screen.getByText('Write to Acme about {{product}}')).toBeInTheDocument();
  });

  it('queues the run with every variable, says so and hands back the job', async () => {
    const user = userEvent.setup();
    gql.runPrompt.mockResolvedValue({
      data: { runPrompt: { id: 'job-7', name: 'Outreach for Acme', status: 'QUEUED', error: '' } },
    });
    const { onDone } = renderForm();
    await waitFor(() => expect(model()).toHaveValue('gpt-4o'));
    await user.type(screen.getByLabelText('company'), 'Acme');
    await user.click(runButton());
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('job-7'));
    expect(gql.runPrompt).toHaveBeenCalledWith({
      variables: {
        id: 'prompt-1',
        model: 'gpt-4o',
        variables: [
          { name: 'company', value: 'Acme' },
          { name: 'product', value: '' },
        ],
      },
    });
    expect(await screen.findByText('"Outreach for Acme" queued')).toBeInTheDocument();
  });

  it('runs a prompt without placeholders with no variables', async () => {
    const user = userEvent.setup();
    gql.runPrompt.mockResolvedValue({ data: { runPrompt: { id: 'job-8', name: 'Plain' } } });
    const { onDone } = renderForm({ ...PROMPT, content: 'Say hi', variables: [] });
    expect(screen.getByText('Say hi')).toBeInTheDocument();
    await waitFor(() => expect(model()).toHaveValue('gpt-4o'));
    await user.click(runButton());
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('job-8'));
    expect(gql.runPrompt.mock.calls[0][0].variables.variables).toEqual([]);
  });

  it('does nothing more when the server answers without a job', async () => {
    const user = userEvent.setup();
    gql.runPrompt.mockResolvedValue({ data: null });
    const { onDone } = renderForm();
    await waitFor(() => expect(model()).toHaveValue('gpt-4o'));
    await user.click(runButton());
    await waitFor(() => expect(gql.runPrompt).toHaveBeenCalledTimes(1));
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.queryByText(/queued/)).not.toBeInTheDocument();
  });

  it.each([
    [
      'the server’s reason',
      new Error('The monthly AI budget is spent'),
      'The monthly AI budget is spent',
    ],
    ['a plain sentence', 'offline', 'The run could not be started'],
  ])('reports a run that could not start with %s', async (_case, failure, message) => {
    const user = userEvent.setup();
    gql.runPrompt.mockRejectedValue(failure);
    const { onDone } = renderForm();
    await waitFor(() => expect(model()).toHaveValue('gpt-4o'));
    await user.click(runButton());
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('will not run without a model, and says why the list is empty', async () => {
    const user = userEvent.setup();
    gql.models = { options: [], defaultModel: '', loading: false, error: 'No active OpenAI key' };
    renderForm();
    expect(screen.getByText('No active OpenAI key')).toBeInTheDocument();
    await user.click(runButton());
    expect(await screen.findByText('Pick the model to run this on')).toBeInTheDocument();
    expect(gql.runPrompt).not.toHaveBeenCalled();
  });

  it('picks up the default model when it arrives after the dialog opened', async () => {
    gql.models = { ...gql.models, defaultModel: '' };
    const { rerender, onDone, onCancel } = renderForm();
    expect(model()).toHaveValue('');
    expect(screen.getByText('Models the active OpenAI key can reach')).toBeInTheDocument();
    gql.models = { ...gql.models, defaultModel: 'gpt-4o-mini' };
    rerender(<RunPromptForm prompt={PROMPT} onDone={onDone} onCancel={onCancel} />);
    await waitFor(() => expect(model()).toHaveValue('gpt-4o-mini'));
  });

  it('cancels without running', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.runPrompt).not.toHaveBeenCalled();
  });
});
