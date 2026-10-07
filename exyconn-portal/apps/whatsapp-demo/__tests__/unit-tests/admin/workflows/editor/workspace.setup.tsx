import userEvent from '@testing-library/user-event';
import type { GraphIssue } from '@exyconn/wa-flow';
import { EditorWorkspace } from '../../../../../src/admin/workflows/editor/EditorWorkspace';
import type { WorkflowEditor } from '../../../../../src/admin/workflows/editor/useWorkflowEditor';
import type { WorkflowRow } from '../../../../../src/admin/workflows/model/api';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';
import { demoRow, workflowRow } from '../../admin.fixtures';
import { fakeEditor } from './workflow-actions.helpers';

/** Two errors (one on text-1, one on the graph) and a warning on end-2. */
export const ISSUES = [
  { severity: 'error', message: 'Unwired', nodeId: 'text-1' },
  { severity: 'warning', message: 'Long', nodeId: 'end-2' },
  { severity: 'error', message: 'No start' },
] as unknown as GraphIssue[];

export const SIBLINGS = [workflowRow(), workflowRow({ id: 'wf-2', key: 'faq' })];

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

interface MountOptions {
  editor?: WorkflowEditor;
  siblings?: readonly WorkflowRow[];
}

/** Mounts the workspace on the editor's route, with the current URL beside it. */
export function mountWorkspace(options: MountOptions = {}) {
  const editor = options.editor ?? fakeEditor();
  // `siblings: undefined` is a case of its own: the demo's workflows have not loaded yet.
  const siblings = 'siblings' in options ? options.siblings : SIBLINGS;
  const user = userEvent.setup();
  renderWithProviders(
    <>
      <EditorWorkspace
        workflow={workflowRow()}
        demo={demoRow()}
        siblings={siblings}
        aiConfigured
        editor={editor}
      />
      <Url />
    </>,
    { route: '/admin/bot-workflows/wf-1' },
  );
  return { user, editor };
}
