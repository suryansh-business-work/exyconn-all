import type { DragEvent } from 'react';
import { useT } from '@exyconn/i18n';
import { NODE_TYPES, type NodeType } from '@exyconn/wa-flow';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@exyconn/shell/components/ui';
import { NODE_GROUPS, NODE_META } from '../../model/node-meta';
import { PALETTE_MIME } from './palette-drag';

interface NodePaletteProps {
  /** Adds a node of the type at the centre of the view (click, Enter or Space). */
  onAdd: (type: NodeType) => void;
  /** The node types this flow may use (a call flow has no cards); every type when left out. */
  types?: readonly NodeType[];
}

const startDrag = (type: NodeType) => (event: DragEvent) => {
  event.dataTransfer.setData(PALETTE_MIME, type);
  event.dataTransfer.effectAllowed = 'copy';
};

/** Every node type, grouped: drag one onto the canvas, or click (or press Enter) to add it. */
export function NodePalette({ onAdd, types = NODE_TYPES }: Readonly<NodePaletteProps>) {
  const t = useT();
  return (
    <List dense disablePadding aria-label={t('Add a node')}>
      {NODE_GROUPS.filter((group) => types.some((type) => NODE_META[type].group === group)).map(
        (group) => (
          <li key={group}>
            <List dense disablePadding>
              <ListSubheader disableSticky>{t(group)}</ListSubheader>
              {types
                .filter((type) => NODE_META[type].group === group)
                .map((type) => {
                  const meta = NODE_META[type];
                  const Icon = meta.icon;
                  return (
                    <ListItemButton
                      key={type}
                      draggable
                      onDragStart={startDrag(type)}
                      onClick={() => onAdd(type)}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Icon fontSize="small" sx={{ color: `${meta.color}.main` }} />
                      </ListItemIcon>
                      <ListItemText primary={t(meta.label)} secondary={t(meta.hint)} />
                    </ListItemButton>
                  );
                })}
            </List>
          </li>
        ),
      )}
    </List>
  );
}
