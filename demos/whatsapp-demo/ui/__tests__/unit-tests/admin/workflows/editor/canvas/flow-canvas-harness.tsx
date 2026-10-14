import type { DragEvent } from 'react';
import type { Connection, Edge, EdgeChange, NodeChange } from '@xyflow/react';
import type { WaGraph } from '@exyconn/wa-flow';
import { useTheme } from '@exyconn/shell/components/ui';
import { FlowCanvas } from '../../../../../../src/admin/workflows/editor/canvas/FlowCanvas';
import type {
  FlowView,
  WaFlowNode,
} from '../../../../../../src/admin/workflows/editor/canvas/flow-nodes';
import { renderWithProviders } from '../../../../test-utils';
import { makeNode } from '../inspector/node-form-helpers';
import { flow } from './xyflow-mock';

interface FlowProps {
  nodes: WaFlowNode[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange<WaFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (link: Connection) => void;
  isValidConnection: (link: Connection | Edge) => boolean;
  onDrop: (event: DragEvent) => void;
  onDragOver: (event: DragEvent) => void;
  deleteKeyCode: string[];
  colorMode: string;
}

/** The props FlowCanvas last gave React Flow. */
export const props = () => flow.props as FlowProps;

export const GRAPH: WaGraph = {
  start: 'text-1',
  nodes: [makeNode('text'), makeNode('ai', {}, 'ai-1')],
  edges: [{ id: 'text-1--next', source: 'text-1', sourceHandle: 'next', target: 'ai-1' }],
};

const VIEW: FlowView = { selectedId: 'ai-1', issues: new Map(), aiConfigured: true };

function ThemeProbe() {
  flow.theme = useTheme();
  return null;
}

/** Mounts the canvas over {@link GRAPH} with `ai-1` selected. */
export function mount(graph = GRAPH) {
  const onChange = vi.fn<(edit: (graph: WaGraph) => WaGraph) => void>();
  const onSelect = vi.fn<(id: string | null) => void>();
  const ui = (g: WaGraph) => (
    <>
      <ThemeProbe />
      <FlowCanvas
        graph={g}
        view={VIEW}
        workflowKeys={['main']}
        onChange={onChange}
        onSelect={onSelect}
      />
    </>
  );
  const view = renderWithProviders(ui(graph));
  /** The graph edit of the `call`-th change, applied to {@link GRAPH}. */
  const edited = (call = 0) => onChange.mock.calls[call][0](GRAPH);
  return { onChange, onSelect, edited, rerender: (g: WaGraph) => view.rerender(ui(g)) };
}
