import type { ReactNode } from 'react';

/** What the stubbed React Flow last received, shared by the canvas tests. */
export const flow = {
  props: {} as unknown,
  nodeColor: undefined as unknown,
  theme: undefined as unknown,
  toFlow: vi.fn((point: { x: number; y: number }) => ({ x: point.x / 2, y: point.y / 2 })),
};

/**
 * `@xyflow/react` with the canvas itself stubbed: jsdom cannot measure or drag, so a test
 * drives the handlers FlowCanvas hands to React Flow directly.
 */
export function xyflowMock(original: object) {
  return {
    ...original,
    ReactFlow: (props: Readonly<{ children?: ReactNode }>) => {
      flow.props = props;
      return <div data-testid="flow">{props.children}</div>;
    },
    Background: () => null,
    Controls: () => null,
    MiniMap: ({ nodeColor }: Readonly<{ nodeColor: unknown }>) => {
      flow.nodeColor = nodeColor;
      return null;
    },
    useReactFlow: () => ({ screenToFlowPosition: flow.toFlow }),
  };
}
