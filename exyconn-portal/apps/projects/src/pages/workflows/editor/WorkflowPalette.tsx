import { useT } from '@exyconn/i18n';
import { Button, Flex, Text, Tooltip } from '@exyconn/shell/components/ui';
import { WorkflowNodeKind } from '@exyconn/shell/graphql/generated';
import { WORKFLOW_KINDS, WORKFLOW_KIND_ORDER } from './workflow-graph';

interface WorkflowPaletteProps {
  /** A workflow has exactly one Start, so the button is off once there is one. */
  hasStart: boolean;
  onAdd: (kind: WorkflowNodeKind) => void;
}

/** One button per kind of box. A new box lands below the others, selected, ready to name. */
export function WorkflowPalette({ hasStart, onAdd }: Readonly<WorkflowPaletteProps>) {
  const t = useT();
  return (
    <Flex direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
      <Text size="caption" color="text.secondary">
        {t('Add')}
      </Text>
      {WORKFLOW_KIND_ORDER.map((kind) => {
        const meta = WORKFLOW_KINDS[kind];
        const Icon = meta.icon;
        return (
          <Tooltip key={kind} title={t(meta.hint)}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Icon sx={{ color: meta.color }} />}
                disabled={kind === WorkflowNodeKind.Start && hasStart}
                onClick={() => onAdd(kind)}
              >
                {t(meta.label)}
              </Button>
            </span>
          </Tooltip>
        );
      })}
    </Flex>
  );
}
