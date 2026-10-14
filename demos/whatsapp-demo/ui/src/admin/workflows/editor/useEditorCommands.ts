/**
 * The editor's canvas commands that need React Flow's viewport: add a node where the author
 * is looking, jump to the node an issue is about, tidy the layout, and the inspector's
 * Apply / Set as start / Delete.
 */
import { useCallback, type RefObject } from 'react';
import { useReactFlow } from '@xyflow/react';
import { autoLayout, type NodeType, type WaNode } from '@exyconn/wa-flow';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { addNode, removeNodes, setStart, updateNodeData } from '../model/graph-ops';
import type { WorkflowEditor } from './useWorkflowEditor';

const FOCUS = { duration: 300, maxZoom: 1.2 } as const;

export function useEditorCommands(
  editor: WorkflowEditor,
  workflowKeys: readonly string[],
  canvas: RefObject<HTMLElement | null>,
) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const confirm = useConfirm();
  const { graph, update, select, selectedId } = editor;

  const add = useCallback(
    (type: NodeType) => {
      const box = canvas.current?.getBoundingClientRect();
      const centre = box
        ? screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 })
        : { x: 0, y: 0 };
      const result = addNode(graph, type, centre, workflowKeys);
      update(() => result.graph);
      select(result.id);
    },
    [canvas, graph, screenToFlowPosition, select, update, workflowKeys],
  );

  const focus = useCallback(
    (nodeId: string) => {
      select(nodeId);
      fitView({ ...FOCUS, nodes: [{ id: nodeId }] }).catch((error: unknown) =>
        console.error('Could not bring the node into view', error),
      );
    },
    [fitView, select],
  );

  const tidy = useCallback(() => {
    update(autoLayout);
    globalThis.requestAnimationFrame(() => {
      fitView({ duration: FOCUS.duration }).catch((error: unknown) =>
        console.error('Could not fit the canvas', error),
      );
    });
  }, [fitView, update]);

  const apply = useCallback(
    (data: WaNode['data']) => {
      if (selectedId) {
        update((g) => updateNodeData(g, selectedId, data));
      }
    },
    [selectedId, update],
  );

  const makeStart = useCallback(() => {
    if (selectedId) {
      update((g) => setStart(g, selectedId));
    }
  }, [selectedId, update]);

  const remove = useCallback(async () => {
    if (!selectedId) {
      return;
    }
    const ok = await confirm({
      title: 'Delete node',
      message: 'Delete "{id}" and every wire to and from it?',
      messageValues: { id: selectedId },
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok) {
      update((g) => removeNodes(g, [selectedId]));
      select(null);
    }
  }, [confirm, select, selectedId, update]);

  return { add, focus, tidy, apply, makeStart, remove };
}
