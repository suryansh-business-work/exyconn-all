import { vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import type { WaGraph } from '@exyconn/wa-flow';
import { useWorkflowActions } from '../../../../../src/admin/workflows/editor/useWorkflowActions';
import type { WorkflowEditor } from '../../../../../src/admin/workflows/editor/useWorkflowEditor';
import type { WorkflowRow } from '../../../../../src/admin/workflows/model/api';
import { renderHookWithProviders } from '../../../test-utils';
import { SAMPLE_GRAPH } from '../../admin.fixtures';

export { mutations, resetMutations } from './workflow-mutations.mock';

export const EDITED_GRAPH: WaGraph = { ...SAMPLE_GRAPH, start: 'end-2' };

/** An editor holding an edited copy; `adopt` and `select` are spies. */
export function fakeEditor(overrides: Partial<WorkflowEditor> = {}): WorkflowEditor {
  return {
    graph: EDITED_GRAPH,
    meta: { name: 'Edited name', description: 'Edited', keywords: ['hi'], order: 4 },
    dirty: false,
    selectedId: 'text-1',
    select: vi.fn(),
    update: vi.fn(),
    setMeta: vi.fn(),
    adopt: vi.fn(),
    ...overrides,
  };
}

export function mountActions(workflow: WorkflowRow | null | undefined, editor: WorkflowEditor) {
  return renderHookWithProviders(() => useWorkflowActions(workflow, editor));
}

/** Answers the open confirmation dialog; returns what it asked. */
export async function answer(
  user: ReturnType<typeof userEvent.setup>,
  button: string,
): Promise<string> {
  const dialog = await screen.findByRole('dialog');
  const question = dialog.textContent ?? '';
  await user.click(within(dialog).getByRole('button', { name: button }));
  return question;
}
