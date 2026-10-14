import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NodeType, WaGraph } from '@exyconn/wa-flow';
import { Box, useTheme } from '@exyconn/shell/components/ui';
import { NODE_META } from '../../model/node-meta';
import { addNode, connect, moveNode, removeEdges, removeNodes } from '../../model/graph-ops';
import { FLOW_NODE_TYPES } from './node-types';
import { PALETTE_MIME } from './palette-drag';
import { toFlowNodes, type FlowView, type WaFlowNode } from './flow-nodes';

interface FlowCanvasProps {
  graph: WaGraph;
  view: FlowView;
  workflowKeys: readonly string[];
  onChange: (edit: (graph: WaGraph) => WaGraph) => void;
  onSelect: (id: string | null) => void;
}

const DELETE_KEYS = ['Backspace', 'Delete'];

/** A wire may not loop a node onto itself. */
const isValidConnection = (link: Connection | Edge) => link.source !== link.target;

/**
 * The React Flow canvas over the draft graph. Every change React Flow reports — a drag, a
 * new wire, a deletion — becomes a pure graph edit; React Flow's own node copy only carries
 * what it measures. One wire per output: connecting an output again replaces its wire.
 */
export function FlowCanvas({
  graph,
  view,
  workflowKeys,
  onChange,
  onSelect,
}: Readonly<FlowCanvasProps>) {
  const theme = useTheme();
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes] = useState<WaFlowNode[]>(() => toFlowNodes(graph, view, []));
  const [selectedEdges, setSelectedEdges] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    setNodes((previous) => toFlowNodes(graph, view, previous));
  }, [graph, view]);

  const edges = useMemo<Edge[]>(
    () =>
      graph.edges.map((edge) => ({
        ...edge,
        selected: selectedEdges.has(edge.id),
        style: { stroke: theme.palette.text.secondary, strokeWidth: 1.5 },
      })),
    [graph.edges, selectedEdges, theme.palette.text.secondary],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<WaFlowNode>[]) => {
      setNodes((current) => applyNodeChanges(changes, current));
      const removed = changes.flatMap((c) => (c.type === 'remove' ? [c.id] : []));
      if (removed.length > 0) {
        onChange((g) => removeNodes(g, removed));
      }
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          const { id, position } = change;
          onChange((g) => moveNode(g, id, position));
        }
      }
      // React Flow reports a new selection and the old one's deselection in node order, so
      // the pick wins over any deselection in the same batch.
      const picked = changes.find((c) => c.type === 'select' && c.selected);
      const dropped = changes.some(
        (c) => (c.type === 'select' || c.type === 'remove') && c.id === view.selectedId,
      );
      if (picked?.type === 'select') {
        onSelect(picked.id);
      } else if (dropped) {
        onSelect(null);
      }
    },
    [onChange, onSelect, view.selectedId],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed = changes.flatMap((c) => (c.type === 'remove' ? [c.id] : []));
      if (removed.length > 0) {
        onChange((g) => removeEdges(g, removed));
      }
      setSelectedEdges((current) => {
        const next = new Set(current);
        for (const change of changes) {
          if (change.type === 'select' && change.selected) {
            next.add(change.id);
          } else if (change.type === 'select' || change.type === 'remove') {
            next.delete(change.id);
          }
        }
        return next;
      });
    },
    [onChange],
  );

  const onConnect = useCallback(
    (link: Connection) => {
      if (link.sourceHandle) {
        const { source, sourceHandle, target } = link;
        onChange((g) => connect(g, { source, sourceHandle, target }));
      }
    },
    [onChange],
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      const type = event.dataTransfer.getData(PALETTE_MIME) as NodeType;
      if (!type || !(type in NODE_META)) {
        return;
      }
      event.preventDefault();
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onChange((g) => addNode(g, type, position, workflowKeys).graph);
    },
    [onChange, screenToFlowPosition, workflowKeys],
  );

  const minimapColor = useCallback(
    (node: WaFlowNode) => theme.palette[NODE_META[node.data.node.type].color].main,
    [theme],
  );

  return (
    <Box sx={{ height: '100%', minHeight: 360 }}>
      <ReactFlow<WaFlowNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={FLOW_NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onDrop={onDrop}
        onDragOver={(event) => event.preventDefault()}
        deleteKeyCode={DELETE_KEYS}
        colorMode={theme.palette.mode}
        minZoom={0.1}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap<WaFlowNode> nodeColor={minimapColor} pannable zoomable />
      </ReactFlow>
    </Box>
  );
}
