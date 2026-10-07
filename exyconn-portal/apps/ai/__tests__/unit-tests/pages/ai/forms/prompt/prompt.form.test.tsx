import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptCategory } from '@exyconn/shell/graphql/generated';
import { PromptForm, type PromptRow } from '../../../../../../src/pages/ai/forms/prompt';
import { renderWithProviders } from '../../../../test-utils';

interface AssistProps {
  label: string;
  text: string;
  task: { action: string; style?: string };
  onResult: (result: string) => void;
}

const gql = vi.hoisted(() => ({
  createPrompt: vi.fn(),
  updatePrompt: vi.fn(),
  assist: null as null | { text: string; task: { action: string; style?: string } },
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreatePromptMutation: () => [gql.createPrompt],
  useUpdatePromptMutation: () => [gql.updatePrompt],
}));

/** The real button runs an AI job; the stand-in hands back a fixed description. */
vi.mock('@exyconn/shell/components/ai', () => ({
  AiAssistButton: ({ label, text, task, onResult }: Readonly<AssistProps>) => {
    gql.assist = { text, task };
    return (
      <button type="button" onClick={() => onResult('Writes the weekly digest')}>
        {label}
      </button>
    );
  },
}));

const ROW: PromptRow = {
  id: 'prompt-1',
  title: 'Digest',
  category: PromptCategory.Coding,
  content: 'Summarise {{repo}}',
  description: null,
  tags: ['weekly', 'team'],
  variables: ['repo'],
};

function renderForm(initial: PromptRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<PromptForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('PromptForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a general prompt, splitting the tags and sending no empty description', async () => {
    const user = userEvent.setup();
    gql.createPrompt.mockResolvedValue({ data: { createPrompt: { id: 'prompt-2' } } });
    const { onDone } = renderForm();
    await user.type(screen.getByLabelText('Prompt title'), ' Release notes ');
    await user.type(screen.getByLabelText('Prompt'), 'Draft notes');
    await user.type(screen.getByLabelText('Tags (comma separated)'), ' release , ,notes, ');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.createPrompt).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Release notes',
          category: PromptCategory.General,
          content: 'Draft notes',
          description: null,
          tags: ['release', 'notes'],
        },
      },
    });
    expect(await screen.findByText('Prompt created')).toBeInTheDocument();
  });

  it('opens an existing prompt with its tags joined and updates it', async () => {
    const user = userEvent.setup();
    gql.updatePrompt.mockResolvedValue({ data: { updatePrompt: { id: 'prompt-1' } } });
    const { onDone } = renderForm(ROW);
    expect(screen.getByLabelText('Tags (comma separated)')).toHaveValue('weekly, team');
    expect(screen.getByLabelText('Description (optional)')).toHaveValue('');
    await user.type(screen.getByLabelText('Description (optional)'), 'Repo digest');
    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.updatePrompt).toHaveBeenCalledWith({
      variables: {
        id: 'prompt-1',
        input: {
          title: 'Digest',
          category: PromptCategory.Coding,
          content: 'Summarise {{repo}}',
          description: 'Repo digest',
          tags: ['weekly', 'team'],
        },
      },
    });
  });

  it('says what is missing or too long before anything is sent', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByLabelText('Description (optional)'));
    await user.paste('d'.repeat(301));
    await user.click(screen.getByLabelText('Tags (comma separated)'));
    await user.paste('t'.repeat(201));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Prompt content is required')).toBeInTheDocument();
    expect(screen.getByText('Keep the description under 300 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep tags under 200 characters')).toBeInTheDocument();
    expect(gql.createPrompt).not.toHaveBeenCalled();
  });

  it('asks the AI for a brief summary of the prompt and uses it as the description', async () => {
    const user = userEvent.setup();
    renderForm(ROW);
    expect(gql.assist).toEqual({
      text: 'Summarise {{repo}}',
      task: { action: 'SUMMARISE', style: 'BRIEF' },
    });
    await user.click(screen.getByRole('button', { name: 'Describe this prompt' }));
    expect(screen.getByLabelText('Description (optional)')).toHaveValue('Writes the weekly digest');
  });

  it('hands the AI the prompt as it is being typed', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Prompt'), 'Plan the sprint');
    expect(gql.assist?.text).toBe('Plan the sprint');
  });

  it('reports a failed save and cancels without saving', async () => {
    const user = userEvent.setup();
    gql.updatePrompt.mockRejectedValue(new Error('Prompt is locked'));
    const { onDone, onCancel } = renderForm(ROW);
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(await screen.findByText('Prompt is locked')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
