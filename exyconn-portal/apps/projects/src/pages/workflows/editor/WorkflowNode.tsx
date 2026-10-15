import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { WorkflowNodeKind } from '@exyconn/shell/graphql/generated';
import { WORKFLOW_KINDS, type WorkflowFlowNode } from './workflow-graph';

/** Width of every box, so arrows line up and the canvas reads as a column of steps. */
export const WORKFLOW_NODE_WIDTH = 200;

/**
 * One box on the canvas: its kind's icon and colour, and its name. Arrows go in at the top
 * and out at the bottom — except into a Start or out of an End, which have no such side.
 */
export function WorkflowNode({ data, selected }: Readonly<NodeProps<WorkflowFlowNode>>) {
  const t = useT();
  const meta = WORKFLOW_KINDS[data.kind];
  const Icon = meta.icon;
  const isBoundary = data.kind === WorkflowNodeKind.Start || data.kind === WorkflowNodeKind.End;

  return (
    <Box
      sx={{
        width: WORKFLOW_NODE_WIDTH,
        px: 1.5,
        py: 1,
        bgcolor: 'background.paper',
        border: 2,
        borderColor: selected ? 'primary.main' : meta.color,
        borderRadius: 1,
        // A decision is the one box that forks, so it is the one drawn dashed; Start and End
        // carry a heavier edge so the way in and the ways out are found at a glance.
        borderStyle: data.kind === WorkflowNodeKind.Decision ? 'dashed' : 'solid',
        borderLeftWidth: isBoundary ? 6 : 2,
        boxShadow: selected ? 3 : 1,
      }}
    >
      {data.kind === WorkflowNodeKind.Start ? null : (
        <Handle type="target" position={Position.Top} />
      )}
      <Flex direction="row" alignItems="center" spacing={1}>
        <Icon fontSize="small" sx={{ color: meta.color }} aria-hidden />
        <Box sx={{ minWidth: 0 }}>
          <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t(meta.label)}
          </Text>
          <Text size="sm" sx={{ overflowWrap: 'anywhere' }}>
            {data.label}
          </Text>
        </Box>
      </Flex>
      {data.kind === WorkflowNodeKind.End ? null : (
        <Handle type="source" position={Position.Bottom} />
      )}
    </Box>
  );
}
