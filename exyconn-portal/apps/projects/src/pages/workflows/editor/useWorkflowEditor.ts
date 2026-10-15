import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import {
  WorkflowNodeKind,
  useProjectWorkflowQuery,
  useSaveProjectWorkflowGraphMutation,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { newEdge, newNode, toFlow, toGraphInput, type WorkflowFlowNode } from './workflow-graph';

/** Changes that are React Flow keeping its own books, not somebody editing the drawing. */
const NOT_EDITS = new Set(['select', 'dimensions']);

/** How far below the lowest box a new one is dropped, so it never lands on top of another. */
const DROP_GAP = 120;

/**
 * The workflow designer's state: the saved workflow, the drawing on the canvas, whether the
 * two differ, and every edit the canvas, the palette and the inspector can make.
 */
export function useWorkflowEditor(id: string) {
  const notify = useNotify();
  const query = useProjectWorkflowQuery({
    variables: { id },
    skip: id === '',
    fetchPolicy: 'network-only',
  });
  const [saveGraph, { loading: saving }] = useSaveProjectWorkflowGraphMutation();
  const [nodes, setNodes, applyNodeChanges] = useNodesState<WorkflowFlowNode>([]);
  const [edges, setEdges, applyEdgeChanges] = useEdgesState<Edge>([]);
  const [dirty, setDirty] = useState(false);
  const workflow = query.data?.projectWorkflow ?? null;

  // The drawing is loaded once per workflow: a refetch must never overwrite unsaved work.
  const loadedId = useRef('');
  useEffect(() => {
    if (workflow && loadedId.current !== workflow.id) {
      loadedId.current = workflow.id;
      const flow = toFlow(workflow);
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setDirty(false);
    }
  }, [workflow, setNodes, setEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowFlowNode>[]) => {
      applyNodeChanges(changes);
      if (changes.some((change) => !NOT_EDITS.has(change.type))) {
        setDirty(true);
      }
    },
    [applyNodeChanges],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      applyEdgeChanges(changes);
      if (changes.some((change) => !NOT_EDITS.has(change.type))) {
        setDirty(true);
      }
    },
    [applyEdgeChanges],
  );

  /** Joins two boxes. A second arrow between the same two boxes adds nothing, so it is skipped. */
  const onConnect = useCallback(
    ({ source, target }: Connection) => {
      setEdges((current) =>
        current.some((edge) => edge.source === source && edge.target === target)
          ? current
          : [...current, newEdge(source, target)],
      );
      setDirty(true);
    },
    [setEdges],
  );

  const addNode = (kind: WorkflowNodeKind) => {
    const lowest = nodes.reduce((max, node) => Math.max(max, node.position.y), -DROP_GAP);
    const node = newNode(kind, { x: 0, y: lowest + DROP_GAP });
    setNodes((current) => [
      ...current.map((one) => ({ ...one, selected: false })),
      { ...node, selected: true },
    ]);
    setDirty(true);
  };

  const renameNode = (nodeId: string, label: string) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, label } } : node,
      ),
    );
    setDirty(true);
  };

  const labelEdge = (edgeId: string, label: string) => {
    setEdges((current) => current.map((edge) => (edge.id === edgeId ? { ...edge, label } : edge)));
    setDirty(true);
  };

  /** Removes whatever is selected, and every arrow left pointing at a removed box. */
  const removeSelected = () => {
    const gone = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
    setNodes((current) => current.filter((node) => !gone.has(node.id)));
    setEdges((current) =>
      current.filter((edge) => !edge.selected && !gone.has(edge.source) && !gone.has(edge.target)),
    );
    setDirty(true);
  };

  const deselect = () => {
    setNodes((current) => current.map((node) => ({ ...node, selected: false })));
    setEdges((current) => current.map((edge) => ({ ...edge, selected: false })));
  };

  const save = async () => {
    try {
      await saveGraph({ variables: { id, graph: toGraphInput(nodes, edges) } });
      setDirty(false);
      notify('Workflow saved');
    } catch (error) {
      notify(errorMessage(error, 'Could not save the workflow'), 'error');
    }
  };

  return {
    workflow,
    loading: query.loading && !workflow,
    error: query.error,
    nodes,
    edges,
    dirty,
    saving,
    hasStart: nodes.some((node) => node.data.kind === WorkflowNodeKind.Start),
    selectedNode: nodes.find((node) => node.selected) ?? null,
    selectedEdge: edges.find((edge) => edge.selected) ?? null,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    renameNode,
    labelEdge,
    removeSelected,
    deselect,
    save,
  };
}

export type WorkflowEditorState = ReturnType<typeof useWorkflowEditor>;
