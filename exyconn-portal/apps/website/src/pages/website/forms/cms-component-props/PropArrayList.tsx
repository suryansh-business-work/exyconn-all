import type { ComponentType } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, IconButton, Paper, Text, Tooltip } from '@exyconn/shell/components/ui';
import { blankLike, moveItem, toTree, type PropNode } from './props-tree';
import type { PropFieldProps } from './PropField';

type ArrayNode = Extract<PropNode, { kind: 'array' }>;

interface PropArrayListProps {
  name: string;
  label: string;
  node: ArrayNode;
  siteId: string;
  onChange: (node: PropNode) => void;
  Field: ComponentType<PropFieldProps>;
}

interface ItemControlsProps {
  index: number;
  count: number;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
}

function ItemControls({ index, count, onMove, onRemove }: Readonly<ItemControlsProps>) {
  const t = useT();
  const position = { position: index + 1 };
  return (
    <Flex justifyContent="flex-end" gap={0.5}>
      <Tooltip title={t('Move up')}>
        <span>
          <IconButton
            size="small"
            aria-label={t('Move item {position} up', position)}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('Move down')}>
        <span>
          <IconButton
            size="small"
            aria-label={t('Move item {position} down', position)}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDownwardIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('Remove')}>
        <IconButton
          size="small"
          color="error"
          aria-label={t('Remove item {position}', position)}
          onClick={onRemove}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Flex>
  );
}

/** A list prop: its items one under another, with add, remove and reorder. */
export function PropArrayList({
  name,
  label,
  node,
  siteId,
  onChange,
  Field,
}: Readonly<PropArrayListProps>) {
  const t = useT();
  const setItems = (items: PropNode[]) => onChange({ ...node, items });
  // A new item copies the first one's shape; an empty list starts with text.
  const add = () =>
    setItems([...node.items, node.items[0] ? blankLike(node.items[0]) : toTree('')]);

  return (
    <Box>
      <Text weight="semibold" component="div" sx={{ mb: 1 }}>
        {t('{label} ({count})', { label, count: node.items.length })}
      </Text>
      <Flex direction="column" gap={1.5}>
        {node.items.map((item, index) => (
          <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
            <ItemControls
              index={index}
              count={node.items.length}
              onMove={(offset) => setItems(moveItem(node.items, index, offset))}
              onRemove={() => setItems(node.items.filter((other) => other.id !== item.id))}
            />
            <Field
              name={name}
              label={t('Item {position}', { position: index + 1 })}
              node={item}
              siteId={siteId}
              onChange={(child) =>
                setItems(node.items.map((other) => (other.id === item.id ? child : other)))
              }
            />
          </Paper>
        ))}
      </Flex>
      <Button size="small" startIcon={<AddIcon />} onClick={add} sx={{ mt: 1 }}>
        {t('Add item')}
      </Button>
    </Box>
  );
}
