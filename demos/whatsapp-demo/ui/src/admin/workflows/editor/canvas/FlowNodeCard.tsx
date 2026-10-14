import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useT } from '@exyconn/i18n';
import { outputHandles } from '@exyconn/wa-flow';
import FlagIcon from '@mui/icons-material/Flag';
import { Box, Chip, Flex, Text, useTheme } from '@exyconn/shell/components/ui';
import { NODE_META } from '../../model/node-meta';
import { nodeSummary } from '../../model/node-summary';
import { AiNotConfigured } from '../panels/AiNotConfigured';
import { NodeOutputs } from './NodeOutputs';
import type { WaFlowNode } from './flow-nodes';

/** Card width on the canvas; `LAYOUT_GAP.x` in wa-flow leaves room for the wires. */
const NODE_WIDTH = 240;

function IssueChips({ errors, warnings }: Readonly<{ errors: number; warnings: number }>) {
  const t = useT();
  return (
    <>
      {errors > 0 && (
        <Chip
          size="small"
          color="error"
          label={errors}
          aria-label={t('{count} errors', { count: errors })}
        />
      )}
      {warnings > 0 && (
        <Chip
          size="small"
          color="warning"
          label={warnings}
          aria-label={t('{count} warnings', { count: warnings })}
        />
      )}
    </>
  );
}

/**
 * One node on the canvas: its type's icon and colour, its id, a one-line summary, issue
 * badges, and a labelled source handle per output (`outputHandles`) plus one target handle.
 */
function FlowNodeCardBase({ data, selected }: Readonly<NodeProps<WaFlowNode>>) {
  const t = useT();
  const theme = useTheme();
  const { node, isStart, errors, warnings, aiMissing } = data;
  const meta = NODE_META[node.type];
  const Icon = meta.icon;
  const color = theme.palette[meta.color].main;
  const summary = nodeSummary(node);
  const summaryText = summary.kind === 'phrase' ? t(summary.text, summary.values) : summary.text;
  const handles = outputHandles(node);

  return (
    <Box
      sx={{
        width: NODE_WIDTH,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: selected ? 'primary.main' : 'divider',
        borderLeft: 4,
        borderLeftColor: `${meta.color}.main`,
        borderRadius: 1,
        boxShadow: selected ? 4 : 1,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        aria-label={t('Input of {id}', { id: node.id })}
        style={{ background: color, width: 10, height: 10 }}
      />
      <Flex direction="column" spacing={0.5} sx={{ px: 1.5, py: 1 }}>
        <Flex alignItems="center" gap={0.75}>
          <Icon fontSize="small" sx={{ color: `${meta.color}.main` }} aria-hidden />
          <Text size="sm" weight="semibold" noWrap sx={{ flexGrow: 1 }}>
            {t(meta.label)}
          </Text>
          {isStart && <Chip size="small" color="success" icon={<FlagIcon />} label={t('Start')} />}
          <IssueChips errors={errors} warnings={warnings} />
        </Flex>
        <Text size="caption" color="text.secondary" noWrap>
          {node.id}
        </Text>
        {summaryText && (
          <Text
            size="caption"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {summaryText}
          </Text>
        )}
        {aiMissing && <AiNotConfigured compact />}
      </Flex>
      {handles.length > 0 && <NodeOutputs handles={handles} color={color} />}
    </Box>
  );
}

export const FlowNodeCard = memo(FlowNodeCardBase);
