import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RunPromptFormProps } from '../../../../src/pages/ai/forms/run-prompt';
import { PromptLibraryPage } from '../../../../src/pages/ai/PromptLibraryPage';
import { renderWithProviders } from '../../test-utils';
import { rowAction } from './crud-stub';
import { pagedPrompt } from './ai-fixtures';

vi.mock('@exyconn/crud', async (orig) => ({
  ...(await orig<typeof import('@exyconn/crud')>()),
  ...(await import('./crud-stub')).crudMocks,
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useListPromptsStatsQuery: () => ({ loading: false, refetch: vi.fn() }),
  useDeletePromptMutation: () => [vi.fn()],
}));

/** The run form has its own tests; the stand-in shows the prompt and reports back. */
vi.mock('../../../../src/pages/ai/forms/run-prompt', async (orig) => ({
  ...(await orig<typeof import('../../../../src/pages/ai/forms/run-prompt')>()),
  RunPromptForm: ({ prompt, onDone, onCancel }: Readonly<RunPromptFormProps>) => (
    <div>
      <p>Running {prompt.title}</p>
      <button type="button" onClick={() => onDone('job-9')}>
        Queue run
      </button>
      <button type="button" onClick={onCancel}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../../../../src/pages/ai/AiJobResult', () => ({
  AiJobResult: ({ id }: Readonly<{ id: string }>) => <p>Result of {id}</p>,
}));

const ROW = pagedPrompt({ title: 'Outreach' });

function openRun() {
  renderWithProviders(<PromptLibraryPage />);
  act(() => {
    rowAction('run')(ROW);
  });
}

function drawerClose(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title });
  return within(heading.parentElement as HTMLElement).getByRole('button', { name: 'Close' });
}

describe('PromptLibraryPage — running a prompt', () => {
  it('opens the run form for the chosen prompt', async () => {
    openRun();
    expect(await screen.findByText('Running Outreach')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Run prompt' })).toBeInTheDocument();
  });

  it('swaps the run form for the queued job’s result, then closes it', async () => {
    const user = userEvent.setup();
    openRun();
    await user.click(await screen.findByRole('button', { name: 'Queue run' }));
    expect(await screen.findByText('Result of job-9')).toBeInTheDocument();
    expect(screen.queryByText('Running Outreach')).not.toBeInTheDocument();
    await user.click(drawerClose('Run result'));
    await waitFor(() => expect(screen.queryByText('Result of job-9')).not.toBeInTheDocument());
  });

  it('closes the run form from its own Back button', async () => {
    const user = userEvent.setup();
    openRun();
    await user.click(await screen.findByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.queryByText('Running Outreach')).not.toBeInTheDocument());
  });

  it('closes the run form from the drawer', async () => {
    const user = userEvent.setup();
    openRun();
    await screen.findByText('Running Outreach');
    await user.click(drawerClose('Run prompt'));
    await waitFor(() => expect(screen.queryByText('Running Outreach')).not.toBeInTheDocument());
    expect(screen.queryByText(/Result of/)).not.toBeInTheDocument();
  });
});
