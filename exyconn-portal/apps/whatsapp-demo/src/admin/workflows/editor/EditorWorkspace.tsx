import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateGraph } from '@exyconn/wa-flow';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { Box, Paper, useMediaQuery, useTheme } from '@exyconn/shell/components/ui';
import { listPath, type DemoRow, type WorkflowRow } from '../model/api';
import { WorkflowDetailsDialog } from '../WorkflowDetailsDialog';
import { FlowCanvas } from './canvas/FlowCanvas';
import { NodePalette } from './canvas/NodePalette';
import { countIssues } from './canvas/flow-nodes';
import { EditorHeader } from './EditorHeader';
import { EditorSidePanel } from './EditorSidePanel';
import { PhoneEditorChrome } from './PhoneEditorChrome';
import { PreviewPane } from './panels/PreviewPane';
import { ValidationPanel } from './panels/ValidationPanel';
import { useEditorCommands } from './useEditorCommands';
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

const PANEL_SX = { minHeight: 0, overflowY: 'auto', borderColor: 'divider' } as const;

/** The editor: header, palette, canvas and side panel (drawers on a phone). */
export function EditorWorkspace({
  workflow,
  demo,
  siblings,
  aiConfigured,
  editor,
}: Readonly<EditorWorkspaceProps>) {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const confirm = useConfirm();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { graph, selectedId, meta } = editor;

  const workflowKeys = useMemo(() => siblings?.map((row) => row.key), [siblings]);
  const issues = useMemo(() => validateGraph(graph, workflowKeys), [graph, workflowKeys]);
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const view = useMemo(
    () => ({ selectedId, issues: countIssues(issues), aiConfigured }),
    [selectedId, issues, aiConfigured],
  );
  const env = useMemo(
    () => ({ workflowKeys: workflowKeys ?? [workflow.key], aiConfigured }),
    [workflowKeys, workflow.key, aiConfigured],
  );
  const commands = useEditorCommands(editor, env.workflowKeys, canvasRef);
  const actions = useWorkflowActions(workflow, editor);
  const bundle = usePreviewBundle(demo, workflow, siblings ?? [], graph, meta);
  useUnloadGuard(editor.dirty);

  const selected = graph.nodes.find((node) => node.id === selectedId);
  const back = async () => {
    const leave =
      !editor.dirty ||
      (await confirm({
        title: 'Unsaved changes',
        message: 'Leave without saving? Your changes since the last save will be lost.',
        confirmText: 'Leave',
        destructive: true,
      }));
    if (leave) {
      navigate(listPath(workflow.demoId));
    }
  };
  const details = { key: workflow.key, ...(meta ?? metaOf(workflow)) };
  const saveDetails = (values: WorkflowDetailsValues) => {
    const { name, description, keywords, order } = values;
    editor.setMeta({ name, description, keywords: [...keywords], order });
    setDetailsOpen(false);
  };

  const sidePanel = (
    <EditorSidePanel
      issues={issues}
      errors={errors}
      selected={selected}
      isStart={selected?.id === graph.start}
      env={env}
      onPick={commands.focus}
      onApply={commands.apply}
      onSetStart={commands.makeStart}
      onDelete={run(commands.remove)}
      onClose={() => editor.select(null)}
      showProblems={!phone}
    />
  );
  const preview = bundle && (
    <PreviewPane
      bundle={bundle}
      startWorkflow={workflow.key}
      onClose={() => setPreviewOpen(false)}
    />
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '80dvh',
        minHeight: 520,
        overflow: 'hidden',
      }}
    >
      <EditorHeader
        name={meta?.name ?? workflow.name}
        workflowKey={workflow.key}
        status={workflow.status}
        version={workflow.version}
        dirty={editor.dirty}
        errors={errors}
        busy={actions.busy}
        onBack={run(back)}
        onDetails={() => setDetailsOpen(true)}
        onTidy={commands.tidy}
        onPreview={() => setPreviewOpen(true)}
        onDiscard={run(actions.onDiscard)}
        onSave={run(actions.onSave)}
        onPublish={run(actions.onPublish)}
      />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '220px 1fr 380px' },
        }}
      >
        {!phone && (
          <Box sx={{ ...PANEL_SX, borderRight: 1 }}>
            <NodePalette onAdd={commands.add} />
          </Box>
        )}
        <Box ref={canvasRef} sx={{ minHeight: 0, minWidth: 0 }}>
          <FlowCanvas
            graph={graph}
            view={view}
            workflowKeys={env.workflowKeys}
            onChange={editor.update}
            onSelect={editor.select}
          />
        </Box>
        {!phone && (
          <Box sx={{ ...PANEL_SX, borderLeft: 1 }}>
            {previewOpen && preview ? preview : sidePanel}
          </Box>
        )}
      </Box>
      {phone && (
        <PhoneEditorChrome
          errors={errors}
          inspectorOpen={Boolean(selected)}
          onCloseInspector={() => editor.select(null)}
          onAdd={commands.add}
          previewOpen={previewOpen}
          onClosePreview={() => setPreviewOpen(false)}
          inspector={sidePanel}
          problems={<ValidationPanel issues={issues} onPick={commands.focus} />}
          preview={preview}
        />
      )}
      <WorkflowDetailsDialog
        open={detailsOpen}
        title="Workflow details"
        initial={details}
        isEdit
        onSubmit={saveDetails}
        onClose={() => setDetailsOpen(false)}
      />
    </Paper>
  );
}
