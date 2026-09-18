import { useMemo } from 'react';
import { Background, Controls, ReactFlow, type Edge, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, useTheme } from '@exyconn/shell/components/ui';
import { layoutOrgForest } from './org-layout';
import { OrgFlowNode, type OrgFlowNodeType } from './OrgFlowNode';
import type { OrgTreeNode } from './org-tree';

const NODE_TYPES: NodeTypes = { person: OrgFlowNode };

// Nodes are neither selectable nor draggable, so React Flow turns their pointer events off;
// the card holds a real button, which needs them back.
const CLICKABLE_NODE = { pointerEvents: 'all' } as const;

interface OrgFlowChartProps {
  trees: OrgTreeNode[];
  onOpen: (id: string) => void;
}

/** The reporting lines drawn with React Flow: pan and zoom for large companies. */
export function OrgFlowChart({ trees, onOpen }: Readonly<OrgFlowChartProps>) {
  const theme = useTheme();
  const { nodes, edges } = useMemo(() => {
    const layout = layoutOrgForest(trees);
    const flowNodes: OrgFlowNodeType[] = layout.placed.map(({ node, x, y }) => ({
      id: node.id,
      type: 'person',
      position: { x, y },
      data: { person: node, onOpen },
      style: CLICKABLE_NODE,
    }));
    const flowEdges: Edge[] = layout.links.map(({ managerId, reportId }) => ({
      id: `${managerId}->${reportId}`,
      source: managerId,
      target: reportId,
      type: 'smoothstep',
      style: { stroke: theme.palette.divider, strokeWidth: 1.5 },
    }));
    return { nodes: flowNodes, edges: flowEdges };
  }, [trees, onOpen, theme.palette.divider]);

  return (
    <Box sx={{ height: { xs: 480, md: '70vh' }, borderRadius: 2, overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        colorMode={theme.palette.mode}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        minZoom={0.1}
        fitView
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  );
}
