import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useT } from '@exyconn/i18n';
import { Avatar, Box, Chip, ListItemButton, Text } from '@exyconn/shell/components/ui';
import { NODE_HEIGHT, NODE_WIDTH } from './org-layout';
import { initialsOf, teamSize, type OrgTreeNode } from './org-tree';

export type OrgFlowNodeData = {
  person: OrgTreeNode;
  onOpen: (id: string) => void;
};

export type OrgFlowNodeType = Node<OrgFlowNodeData, 'person'>;

/** Hidden anchors: the lines are drawn by the chart, never by the viewer. */
const hiddenHandle = { opacity: 0, pointerEvents: 'none' } as const;

/** One person on the chart; a real button, so the chart is usable from the keyboard. */
export function OrgFlowNode({ data }: Readonly<NodeProps<OrgFlowNodeType>>) {
  const t = useT();
  const { person, onOpen } = data;
  const subtitle = [person.designation, person.department].filter(Boolean).join(' · ');
  const size = teamSize(person);

  return (
    <Box
      sx={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} style={hiddenHandle} />
      <ListItemButton
        onClick={() => onOpen(person.id)}
        aria-label={t('Open {name}', { name: person.name })}
        sx={{ height: '100%', px: 1.5, gap: 1 }}
      >
        <Avatar
          src={person.avatarUrl ?? undefined}
          alt=""
          aria-hidden
          sx={{ width: 36, height: 36 }}
        >
          {initialsOf(person.name)}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Text weight="medium" noWrap>
            {person.name}
          </Text>
          <Text size="caption" color="text.secondary" noWrap>
            {subtitle || '—'}
          </Text>
        </Box>
        {size > 0 && (
          <Chip size="small" label={size} aria-label={t('{count} in team', { count: size })} />
        )}
      </ListItemButton>
      <Handle type="source" position={Position.Bottom} isConnectable={false} style={hiddenHandle} />
    </Box>
  );
}
