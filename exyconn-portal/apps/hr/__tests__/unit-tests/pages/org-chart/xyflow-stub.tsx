import type { ComponentType, ReactNode } from 'react';

interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: unknown;
  style?: object;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  style?: object;
}

type NodeRenderer = ComponentType<{ id: string; data: unknown }>;

interface ReactFlowProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  nodeTypes: Record<string, NodeRenderer>;
  children?: ReactNode;
  [prop: string]: unknown;
}

/** What the chart last handed React Flow, for asserting the layout and the settings. */
export const flow: { nodes: FlowNode[]; edges: FlowEdge[]; props: Record<string, unknown> } = {
  nodes: [],
  edges: [],
  props: {},
};

/**
 * Stands in for React Flow, which measures its viewport and so lays out nothing under jsdom:
 * records what it was given and renders each node through the chart's own node types.
 */
function ReactFlowStub({ nodes, edges, nodeTypes, children, ...props }: Readonly<ReactFlowProps>) {
  flow.nodes = nodes;
  flow.edges = edges;
  flow.props = props;
  return (
    <div>
      {nodes.map((node) => {
        const Renderer = nodeTypes[node.type];
        return <Renderer key={node.id} id={node.id} data={node.data} />;
      })}
      {children}
    </div>
  );
}

const Nothing = () => null;

/** The `@xyflow/react` members the org chart uses. */
export const xyflowMock = {
  ReactFlow: ReactFlowStub,
  Background: Nothing,
  Controls: Nothing,
  Handle: Nothing,
  Position: { Top: 'top', Bottom: 'bottom' },
};
