import { Background, Controls, MiniMap, ReactFlow, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, useTheme } from '@exyconn/shell/components/ui';
import { useT } from '@exyconn/i18n';
import { WorkflowNode } from './WorkflowNode';
import type { WorkflowEditorState } from './useWorkflowEditor';

const NODE_TYPES: NodeTypes = { step: WorkflowNode };

/** Both keys remove a selection: Backspace is the Mac habit, Delete everyone else's. */
const DELETE_KEYS = ['Backspace', 'Delete'];

type WorkflowCanvasProps = Pick<
  WorkflowEditorState,
  'nodes' | 'edges' | 'onNodesChange' | 'onEdgesChange' | 'onConnect'
>;

/** The drawing surface: pan, zoom, drag boxes, and drag between dots to connect them. */
export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: Readonly<WorkflowCanvasProps>) {
  const t = useT();
  const theme = useTheme();
  return (
    <Box
      role="region"
      aria-label={t('Workflow canvas')}
      sx={{
        height: { xs: 480, md: '70vh' },
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        deleteKeyCode={DELETE_KEYS}
        colorMode={theme.palette.mode}
        minZoom={0.2}
        fitView
      >
        <Background />
        <MiniMap pannable zoomable ariaLabel={t('Workflow overview')} />
        <Controls />
      </ReactFlow>
    </Box>
  );
}
