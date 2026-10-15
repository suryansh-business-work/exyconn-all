import { useMemo, useRef, type ReactNode } from 'react';
import { validateGraph, type NodeType } from '@exyconn/wa-flow';
import { Box, Paper, useMediaQuery, useTheme } from '@exyconn/shell/components/ui';
import { FlowCanvas } from './canvas/FlowCanvas';
import { NodePalette } from './canvas/NodePalette';
import { countIssues } from './canvas/flow-nodes';
import { EditorSidePanel } from './EditorSidePanel';
import { PhoneEditorChrome } from './PhoneEditorChrome';
import { ValidationPanel } from './panels/ValidationPanel';
import { useEditorCommands } from './useEditorCommands';
import type { GraphEditor } from './useWorkflowEditor';

/** What the workspace hands its header: the error count and the layout command. */
export interface FlowTools {
  errors: number;
  tidy: () => void;
}

interface FlowWorkspaceProps {
  editor: GraphEditor;
  /** Keys a Jump node may name (just the flow's own when it stands alone). */
  workflowKeys: readonly string[];
  aiConfigured: boolean;
  header: (tools: FlowTools) => ReactNode;
  /** The preview, replacing the side panel while open; null when closed. */
  preview: ReactNode;
  previewOpen: boolean;
  onClosePreview: () => void;
  /** Node types the palette offers; all when left out. */
  types?: readonly NodeType[];
}

/** Runs an async handler from a click, reporting a failure it did not handle itself. */
const run = (task: () => Promise<unknown>) => () => {
  task().catch((error: unknown) => console.error('Flow editor action failed', error));
};

const PANEL_SX = { minHeight: 0, overflowY: 'auto', borderColor: 'divider' } as const;

/**
 * The React Flow editor for one graph: palette, canvas, problems and the selected node's
 * inspector (drawers on a phone), with the host's header and preview. Used for chat
 * workflows (`EditorWorkspace`) and for a calling bot's call flow.
 */
export function FlowWorkspace(props: Readonly<FlowWorkspaceProps>) {
  const { editor, workflowKeys, aiConfigured, previewOpen, preview, types } = props;
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('md'));
  const canvasRef = useRef<HTMLDivElement>(null);
  const { graph, selectedId } = editor;

  const issues = useMemo(() => validateGraph(graph, [...workflowKeys]), [graph, workflowKeys]);
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const view = useMemo(
    () => ({ selectedId, issues: countIssues(issues), aiConfigured }),
    [selectedId, issues, aiConfigured],
  );
  const env = useMemo(() => ({ workflowKeys, aiConfigured }), [workflowKeys, aiConfigured]);
  const commands = useEditorCommands(editor, workflowKeys, canvasRef);
  const selected = graph.nodes.find((node) => node.id === selectedId);

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
      {props.header({ errors, tidy: commands.tidy })}
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
            <NodePalette onAdd={commands.add} types={types} />
          </Box>
        )}
        <Box ref={canvasRef} sx={{ minHeight: 0, minWidth: 0 }}>
          <FlowCanvas
            graph={graph}
            view={view}
            workflowKeys={workflowKeys}
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
          onClosePreview={props.onClosePreview}
          inspector={sidePanel}
          problems={<ValidationPanel issues={issues} onPick={commands.focus} />}
          preview={preview}
          types={types}
        />
      )}
    </Paper>
  );
}
