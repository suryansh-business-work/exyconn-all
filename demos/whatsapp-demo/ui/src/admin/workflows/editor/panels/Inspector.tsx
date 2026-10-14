import { useT } from '@exyconn/i18n';
import type { WaNode } from '@exyconn/wa-flow';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FlagIcon from '@mui/icons-material/Flag';
import { Box, Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { NODE_META } from '../../model/node-meta';
import { NodeForm } from '../inspector/NodeForm';
import type { NodeFormEnv } from '../inspector/fields/form-types';

interface InspectorProps {
  node: WaNode;
  isStart: boolean;
  env: NodeFormEnv;
  onApply: (data: WaNode['data']) => void;
  onSetStart: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** The selected node: what it is, Set as start, Delete, and its own form. */
export function Inspector({
  node,
  isStart,
  env,
  onApply,
  onSetStart,
  onDelete,
  onClose,
}: Readonly<InspectorProps>) {
  const t = useT();
  const meta = NODE_META[node.type];
  const Icon = meta.icon;
  return (
    <Box component="section" aria-label={t('Node inspector')} sx={{ p: 2 }}>
      <Flex alignItems="center" gap={1} sx={{ mb: 1 }}>
        <Icon sx={{ color: `${meta.color}.main` }} aria-hidden />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Text component="h2" size="lg" weight="semibold" noWrap>
            {t(meta.label)}
          </Text>
          <Text size="caption" color="text.secondary" noWrap>
            {node.id}
          </Text>
        </Box>
        <IconButton aria-label={t('Close inspector')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Flex>
      <Flex direction="row" wrap gap={1} sx={{ mb: 2 }}>
        <Button size="small" startIcon={<FlagIcon />} disabled={isStart} onClick={onSetStart}>
          {isStart ? t('Start node') : t('Set as start')}
        </Button>
        <Button size="small" color="error" startIcon={<DeleteOutlinedIcon />} onClick={onDelete}>
          {t('Delete node')}
        </Button>
      </Flex>
      <NodeForm key={node.id} node={node} env={env} onApply={onApply} />
    </Box>
  );
}
