import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WorkflowEditor } from '../../../../../src/admin/workflows/editor/useWorkflowEditor';
import type { WorkflowRow } from '../../../../../src/admin/workflows/model/api';
import { workflowRow } from '../../admin.fixtures';
import {
  answer,
  fakeEditor,
  mountActions,
  mutations,
  resetMutations,
} from './workflow-actions.helpers';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const { mutationHooks } = await import('./workflow-mutations.mock');
  return { ...(await importOriginal<object>()), ...mutationHooks };
});

const consoleError = vi.spyOn(console, 'error');

beforeEach(() => {
  resetMutations();
  consoleError.mockImplementation(() => undefined);
});
afterEach(() => {
  consoleError.mockReset();
});

type Action = 'onPublish' | 'onDiscard';

/** Starts an action, answers its confirmation, waits for it to finish; returns the question. */
async function run(action: Action, button: string, workflow: WorkflowRow, editor: WorkflowEditor) {
  const user = userEvent.setup();
  const { result } = mountActions(workflow, editor);
  let pending: Promise<void> = Promise.resolve();
  act(() => {
    pending = result.current[action]();
  });
  const question = await answer(user, button);
  await act(() => pending);
  return question;
}

describe('useWorkflowActions — Publish', () => {
  it('asks first, then publishes and adopts the published version', async () => {
    const published = workflowRow({ version: 3, updatedAt: '2026-10-06T00:00:00.000Z' });
    mutations.publish.mockResolvedValue({ data: { publishWhatsappWorkflow: published } });
    const editor = fakeEditor();
    const question = await run('onPublish', 'Publish', workflowRow(), editor);
    expect(question).toContain('Publish "Edited name"? Every chat runs this version from now on.');
    expect(mutations.save).not.toHaveBeenCalled();
    expect(mutations.publish).toHaveBeenCalledWith({ variables: { id: 'wf-1' } });
    expect(editor.adopt).toHaveBeenCalledWith(published);
    expect(await screen.findByText('Published version 3')).toBeInTheDocument();
  });

  it('names the stored workflow when the editor has no details yet', async () => {
    const question = await run('onPublish', 'Cancel', workflowRow(), fakeEditor({ meta: null }));
    expect(question).toContain('Publish "Book a visit"?');
    expect(mutations.publish).not.toHaveBeenCalled();
  });

  it('saves unsaved edits before publishing them', async () => {
    const editor = fakeEditor({ dirty: true });
    await run('onPublish', 'Publish', workflowRow(), editor);
    expect(mutations.save).toHaveBeenCalledTimes(1);
    expect(mutations.publish).toHaveBeenCalledTimes(1);
    expect(mutations.save.mock.invocationCallOrder[0]).toBeLessThan(
      mutations.publish.mock.invocationCallOrder[0],
    );
  });

  it('does not publish when saving the edits first fails', async () => {
    mutations.save.mockRejectedValue(new Error('Save failed'));
    await run('onPublish', 'Publish', workflowRow(), fakeEditor({ dirty: true }));
    expect(mutations.publish).not.toHaveBeenCalled();
    expect(await screen.findByText('Save failed')).toBeInTheDocument();
  });

  it('adopts nothing when the server echoes nothing back', async () => {
    const editor = fakeEditor();
    await run('onPublish', 'Publish', workflowRow(), editor);
    expect(editor.adopt).not.toHaveBeenCalled();
    expect(screen.queryByText(/Published version/)).not.toBeInTheDocument();
  });

  it('reports and logs a failed publish', async () => {
    const failure = new Error('Graph invalid');
    mutations.publish.mockRejectedValue(failure);
    await run('onPublish', 'Publish', workflowRow(), fakeEditor());
    expect(await screen.findByText('Graph invalid')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('Could not publish the workflow', failure);
  });
});

describe('useWorkflowActions — Discard draft', () => {
  it('asks first, then restores the published version and clears the selection', async () => {
    const restored = workflowRow({ updatedAt: '2026-10-06T00:00:00.000Z' });
    mutations.discard.mockResolvedValue({ data: { discardWhatsappWorkflowDraft: restored } });
    const editor = fakeEditor();
    const question = await run('onDiscard', 'Discard', workflowRow({ version: 2 }), editor);
    expect(question).toContain('Throw away every change since version 2 was published?');
    expect(mutations.discard).toHaveBeenCalledWith({ variables: { id: 'wf-1' } });
    expect(editor.adopt).toHaveBeenCalledWith(restored);
    expect(editor.select).toHaveBeenCalledWith(null);
    expect(await screen.findByText('Draft discarded')).toBeInTheDocument();
  });

  it('keeps the draft when the discard is cancelled', async () => {
    await run('onDiscard', 'Cancel', workflowRow(), fakeEditor());
    expect(mutations.discard).not.toHaveBeenCalled();
  });

  it('changes nothing when the server echoes nothing back', async () => {
    const editor = fakeEditor();
    await run('onDiscard', 'Discard', workflowRow(), editor);
    expect(editor.adopt).not.toHaveBeenCalled();
    expect(editor.select).not.toHaveBeenCalled();
  });

  it('reports and logs a failed discard', async () => {
    const failure = new Error('Nothing to discard');
    mutations.discard.mockRejectedValue(failure);
    await run('onDiscard', 'Discard', workflowRow(), fakeEditor());
    expect(await screen.findByText('Nothing to discard')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('Could not discard the draft', failure);
  });
});

describe('useWorkflowActions — without a workflow', () => {
  it.each<Action>(['onPublish', 'onDiscard'])(
    '%s does nothing and asks nothing',
    async (action) => {
      const { result } = mountActions(null, fakeEditor());
      await act(() => result.current[action]());
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mutations.publish).not.toHaveBeenCalled();
      expect(mutations.discard).not.toHaveBeenCalled();
    },
  );
});
