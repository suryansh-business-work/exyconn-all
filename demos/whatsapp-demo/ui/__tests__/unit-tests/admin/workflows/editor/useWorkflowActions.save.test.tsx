import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { WORKFLOW_QUERIES } from '../../../../../src/admin/workflows/model/api';
import { workflowRow } from '../../admin.fixtures';
import {
  EDITED_GRAPH,
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

describe('useWorkflowActions — Save draft', () => {
  it('refetches the list, the editor and the chat catalog after every change', () => {
    mountActions(workflowRow(), fakeEditor());
    expect(mutations.options.length).toBeGreaterThanOrEqual(3);
    for (const options of mutations.options) {
      expect(options).toEqual({ refetchQueries: WORKFLOW_QUERIES, awaitRefetchQueries: true });
    }
  });

  it('saves the working copy and adopts what the server stored', async () => {
    const saved = workflowRow({ updatedAt: '2026-10-05T00:00:00.000Z' });
    mutations.save.mockResolvedValue({ data: { saveWhatsappWorkflowDraft: saved } });
    const editor = fakeEditor();
    const { result } = mountActions(workflowRow(), editor);
    await act(() => result.current.onSave());
    expect(mutations.save).toHaveBeenCalledWith({
      variables: {
        id: 'wf-1',
        input: {
          name: 'Edited name',
          description: 'Edited',
          keywords: ['hi'],
          order: 4,
          graph: EDITED_GRAPH,
        },
      },
    });
    expect(editor.adopt).toHaveBeenCalledWith(saved);
    expect(await screen.findByText('Draft saved')).toBeInTheDocument();
  });

  it('still confirms the save when the server echoes nothing back', async () => {
    const editor = fakeEditor();
    const { result } = mountActions(workflowRow(), editor);
    await act(() => result.current.onSave());
    expect(editor.adopt).not.toHaveBeenCalled();
    expect(await screen.findByText('Draft saved')).toBeInTheDocument();
  });

  it.each([
    ['no workflow', undefined, fakeEditor()],
    ['no details yet', workflowRow(), fakeEditor({ meta: null })],
  ])('has nothing to save with %s', async (_case, workflow, editor) => {
    const { result } = mountActions(workflow, editor);
    await act(() => result.current.onSave());
    expect(mutations.save).not.toHaveBeenCalled();
    expect(screen.queryByText('Draft saved')).not.toBeInTheDocument();
  });

  it('reports and logs a failed save', async () => {
    const failure = new Error('Draft too large');
    mutations.save.mockRejectedValue(failure);
    const { result } = mountActions(workflowRow(), fakeEditor());
    await act(() => result.current.onSave());
    expect(await screen.findByText('Draft too large')).toBeInTheDocument();
    expect(screen.queryByText('Draft saved')).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('Could not save the draft', failure);
  });

  it('falls back to a plain reason for a failure without a message', async () => {
    mutations.save.mockRejectedValue('nope');
    const { result } = mountActions(workflowRow(), fakeEditor());
    await act(() => result.current.onSave());
    expect(await screen.findByText('Could not save the draft')).toBeInTheDocument();
  });

  it.each([
    ['save', { busy: true, saving: true, publishing: false }],
    ['publish', { busy: true, saving: false, publishing: true }],
    ['discard', { busy: true, saving: false, publishing: false }],
  ] as const)('reports a running %s as busy', (which, flags) => {
    mutations.loading[which] = true;
    const { result } = mountActions(workflowRow(), fakeEditor());
    expect(result.current).toMatchObject(flags);
  });

  it('is idle while nothing runs', () => {
    const { result } = mountActions(workflowRow(), fakeEditor());
    expect(result.current).toMatchObject({ busy: false, saving: false, publishing: false });
  });
});
