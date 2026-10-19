import { useMemo, useState, type ComponentProps } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { listPath, type DemoRow, type WorkflowRow } from '../model/api';
import { useStudio } from '../../StudioContext';
import { WorkflowDetailsDialog } from '../WorkflowDetailsDialog';
import { EditorHeader } from './EditorHeader';
import { FlowWorkspace, type FlowTools } from './FlowWorkspace';
import { PreviewPane } from './panels/PreviewPane';
import { usePreviewBundle } from './usePreviewBundle';
import { useUnloadGuard } from './useUnloadGuard';
import { useWorkflowActions } from './useWorkflowActions';
import { metaOf, type WorkflowEditor } from './useWorkflowEditor';
import type { WorkflowDetailsValues } from '../forms/workflow-details';

interface EditorWorkspaceProps {
  workflow: WorkflowRow;
  demo: DemoRow | undefined;
  /** Every workflow of the demo (this one included); undefined until loaded. */
  siblings: readonly WorkflowRow[] | undefined;
  aiConfigured: boolean;
  editor: WorkflowEditor;
}

/** Runs an async handler from a click, reporting a failure it did not handle itself. */
const run = (task: () => Promise<unknown>) => () => {
  task().catch((error: unknown) => console.error('Workflow editor action failed', error));
};

type HeaderProps = Omit<ComponentProps<typeof EditorHeader>, 'errors' | 'onTidy'>;

/** The workspace's header render callback: the editor header with the workspace's tools. */
function renderHeader({ errors, tidy }: FlowTools, props: Readonly<HeaderProps>) {
  return <EditorHeader {...props} errors={errors} onTidy={tidy} />;
}

/** One chat workflow's editor: the flow workspace with Save, Publish, details and Preview. */
export function EditorWorkspace({
  workflow,
  demo,
  siblings,
  aiConfigured,
  editor,
}: Readonly<EditorWorkspaceProps>) {
  const navigate = useNavigate();
  const { workflowsPath } = useStudio();
  const confirm = useConfirm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { graph, meta } = editor;

  const workflowKeys = useMemo(
    () => siblings?.map((row) => row.key) ?? [workflow.key],
    [siblings, workflow.key],
  );
  const actions = useWorkflowActions(workflow, editor);
  const bundle = usePreviewBundle(demo, workflow, siblings ?? [], graph, meta);
  useUnloadGuard(editor.dirty);

  const back = async () => {
    const leave =
      !editor.dirty ||
      (await confirm({
        title: 'Unsaved changes',
        message: 'Leave without saving? Your changes since the last save will be lost.',
        confirmText: 'Leave',
        destructive: true,
      }));
    if (!leave) {
      return;
    }
    navigate(listPath(workflowsPath, workflow.demoId));
  };
  const details = { key: workflow.key, ...(meta ?? metaOf(workflow)) };
  const saveDetails = (values: WorkflowDetailsValues) => {
    const { name, description, keywords, order } = values;
    editor.setMeta({ name, description, keywords: [...keywords], order });
    setDetailsOpen(false);
  };

  const preview = bundle && (
    <PreviewPane
      bundle={bundle}
      startWorkflow={workflow.key}
      onClose={() => setPreviewOpen(false)}
    />
  );

  const headerProps: HeaderProps = {
    name: meta?.name ?? workflow.name,
    workflowKey: workflow.key,
    status: workflow.status,
    version: workflow.version,
    dirty: editor.dirty,
    busy: actions.busy,
    onBack: run(back),
    onDetails: () => setDetailsOpen(true),
    onPreview: () => setPreviewOpen(true),
    onDiscard: run(actions.onDiscard),
    onSave: run(actions.onSave),
    onPublish: run(actions.onPublish),
  };

  return (
    <>
      <FlowWorkspace
        editor={editor}
        workflowKeys={workflowKeys}
        aiConfigured={aiConfigured}
        preview={preview}
        previewOpen={previewOpen}
        onClosePreview={() => setPreviewOpen(false)}
        header={(tools) => renderHeader(tools, headerProps)}
      />
      <WorkflowDetailsDialog
        open={detailsOpen}
        title="Workflow details"
        initial={details}
        isEdit
        onSubmit={saveDetails}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}
