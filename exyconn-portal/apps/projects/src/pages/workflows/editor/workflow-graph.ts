import { MarkerType, type Edge, type Node, type XYPosition } from '@xyflow/react';
import PlayCircleIcon from '@mui/icons-material/PlayCircleOutlined';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { color } from '@exyconn/shell/components/ui';
import {
  WorkflowNodeKind,
  type ProjectWorkflowGraphFragment,
  type WorkflowGraphInput,
} from '@exyconn/shell/graphql/generated';

/** What a box on the canvas carries: its kind and its name. */
export type WorkflowNodeData = { kind: WorkflowNodeKind; label: string };
export type WorkflowFlowNode = Node<WorkflowNodeData, 'step'>;

/** How each kind of box looks and what a new one is called. */
interface WorkflowKindMeta {
  label: string;
  hint: string;
  icon: SvgIconComponent;
  color: string;
}

/**
 * Presentation for each kind of box. The kinds come from the schema, so a new kind is a
 * compile error here rather than a box drawn with nothing.
 */
export const WORKFLOW_KINDS: Readonly<Record<WorkflowNodeKind, WorkflowKindMeta>> = {
  [WorkflowNodeKind.Start]: {
    label: 'Start',
    hint: 'Where the workflow begins. Exactly one.',
    icon: PlayCircleIcon,
    color: color.green[500],
  },
  [WorkflowNodeKind.Step]: {
    label: 'Step',
    hint: 'A piece of work, a status, or a hand-off.',
    icon: CropSquareIcon,
    color: color.blue[500],
  },
  [WorkflowNodeKind.Decision]: {
    label: 'Decision',
    hint: 'A fork. Label each way out with its answer.',
    icon: CallSplitIcon,
    color: color.amber[500],
  },
  [WorkflowNodeKind.End]: {
    label: 'End',
    hint: 'Where the workflow finishes. One or more.',
    icon: FlagIcon,
    color: color.red[500],
  },
};

/** The kinds in the order the palette offers them. */
export const WORKFLOW_KIND_ORDER: readonly WorkflowNodeKind[] = [
  WorkflowNodeKind.Start,
  WorkflowNodeKind.Step,
  WorkflowNodeKind.Decision,
  WorkflowNodeKind.End,
];

/** Every arrow ends in a head, so the direction of the flow is never a guess. */
const EDGE_STYLE = { markerEnd: { type: MarkerType.ArrowClosed }, type: 'smoothstep' } as const;

/** A fresh id for a box or an arrow. Only the editor reads it; the server checks it is unique. */
export const newKey = () => globalThis.crypto.randomUUID();

/** A new box of the given kind, dropped where the canvas asked for it. */
export function newNode(kind: WorkflowNodeKind, position: XYPosition): WorkflowFlowNode {
  return {
    id: newKey(),
    type: 'step',
    position,
    data: { kind, label: WORKFLOW_KINDS[kind].label },
  };
}

/** A new arrow between two boxes. */
export function newEdge(source: string, target: string): Edge {
  return { id: newKey(), source, target, label: '', ...EDGE_STYLE };
}

/** The saved drawing, as React Flow draws it. */
export function toFlow(graph: ProjectWorkflowGraphFragment): {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
} {
  return {
    nodes: graph.nodes.map((node) => ({
      id: node.key,
      type: 'step',
      position: { x: node.x, y: node.y },
      data: { kind: node.kind, label: node.label },
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.key,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      ...EDGE_STYLE,
    })),
  };
}

/** The drawing on the canvas, as the server stores it. Positions are kept to whole pixels. */
export function toGraphInput(nodes: WorkflowFlowNode[], edges: Edge[]): WorkflowGraphInput {
  return {
    nodes: nodes.map((node) => ({
      key: node.id,
      kind: node.data.kind,
      label: node.data.label,
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
    })),
    edges: edges.map((edge) => ({
      key: edge.id,
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === 'string' ? edge.label : '',
    })),
  };
}
