import { useState } from 'react';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@/components/ui';
import type { ModuleDefinition } from '@/config/modules';

interface HubModuleItemProps {
  module: ModuleDefinition;
  /** Path of the entry the current URL belongs to, across every module. */
  activePath?: string;
  onSelect: (path: string) => void;
}

const itemSx = { borderRadius: 1.5, mb: 0.25, py: 0.5 };
const labelProps = { variant: 'body2' as const, fontWeight: 600 };

/**
 * One module in the hub launcher: a link when it has no pages, otherwise a group that
 * opens to reveal them. Groups start open when the URL is already inside them.
 */
export function HubModuleItem({ module, activePath, onSelect }: Readonly<HubModuleItemProps>) {
  const children = module.children ?? [];
  const childActive = children.some((child) => child.path === activePath);
  const [open, setOpen] = useState<boolean | undefined>(undefined);
  const expanded = open ?? childActive;
  const Icon = module.icon;

  if (children.length === 0) {
    return (
      <ListItemButton
        selected={activePath === module.path}
        onClick={() => onSelect(module.path)}
        sx={itemSx}
      >
        <ListItemIcon sx={{ minWidth: 36, color: module.accent }}>
          <Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={module.label} primaryTypographyProps={labelProps} />
      </ListItemButton>
    );
  }

  return (
    <Box>
      <ListItemButton onClick={() => setOpen(!expanded)} sx={itemSx}>
        <ListItemIcon sx={{ minWidth: 36, color: module.accent }}>
          <Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={module.label} primaryTypographyProps={labelProps} />
        {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItemButton>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List disablePadding sx={{ pl: 2 }}>
          {children.map((child) => (
            <ListItemButton
              key={child.key}
              selected={activePath === child.path}
              onClick={() => onSelect(child.path)}
              sx={itemSx}
            >
              <ListItemIcon sx={{ minWidth: 32, color: module.accent }}>
                <child.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={child.label} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </Box>
  );
}
