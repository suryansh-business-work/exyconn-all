import { useT } from '@exyconn/i18n';
import { Button, Card, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import type { Edge } from '@xyflow/react';
import { WorkflowLabelForm } from '../forms/workflow-label';
import { WORKFLOW_KINDS, type WorkflowFlowNode } from './workflow-graph';

interface WorkflowInspectorProps {
  node: WorkflowFlowNode | null;
  edge: Edge | null;
  onRename: (nodeId: string, label: string) => void;
  onLabelEdge: (edgeId: string, label: string) => void;
  onRemove: () => void;
  onDeselect: () => void;
}

/** How to use the canvas, for when nothing is selected. */
const HOW_TO = [
  'Add boxes with the buttons above, and drag them into place.',
  'Drag from the dot under a box to the dot on top of another to connect them.',
  'Select a box or a connection to name it; press Delete to remove it.',
] as const;

/**
 * The side panel: names the selected box or labels the selected arrow, and removes either.
 * With nothing selected it says how the canvas works, because nobody reads a manual.
 */
export function WorkflowInspector({
  node,
  edge,
  onRename,
  onLabelEdge,
  onRemove,
  onDeselect,
}: Readonly<WorkflowInspectorProps>) {
  const t = useT();
  const remove = (
    <Button color="error" size="small" startIcon={<DeleteOutlineIcon />} onClick={onRemove}>
      {t('Remove')}
    </Button>
  );

  if (node) {
    return (
      <Card variant="outlined" sx={{ p: 2 }}>
        <Heading level={6}>{t(WORKFLOW_KINDS[node.data.kind].label)}</Heading>
        <Text size="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          {t(WORKFLOW_KINDS[node.data.kind].hint)}
        </Text>
        <WorkflowLabelForm
          key={node.id}
          target="step"
          initial={node.data.label}
          onSubmit={(label) => onRename(node.id, label)}
          onCancel={onDeselect}
        />
        <Flex sx={{ mt: 2 }}>{remove}</Flex>
      </Card>
    );
  }

  if (edge) {
    return (
      <Card variant="outlined" sx={{ p: 2 }}>
        <Heading level={6} sx={{ mb: 2 }}>
          {t('Connection')}
        </Heading>
        <WorkflowLabelForm
          key={edge.id}
          target="connection"
          initial={typeof edge.label === 'string' ? edge.label : ''}
          onSubmit={(label) => onLabelEdge(edge.id, label)}
          onCancel={onDeselect}
        />
        <Flex sx={{ mt: 2 }}>{remove}</Flex>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Heading level={6} sx={{ mb: 1 }}>
        {t('How it works')}
      </Heading>
      <Flex direction="column" spacing={1}>
        {HOW_TO.map((line) => (
          <Text key={line} size="sm" color="text.secondary">
            {t(line)}
          </Text>
        ))}
      </Flex>
    </Card>
  );
}
