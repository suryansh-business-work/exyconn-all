import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Avatar,
  Box,
  Chip,
  Collapse,
  Flex,
  IconButton,
  ListItemButton,
  Text,
} from '@exyconn/shell/components/ui';
import { initialsOf, teamSize, type OrgTreeNode } from './org-tree';

/** Levels expanded on first paint; deeper teams open on demand. */
const OPEN_BY_DEFAULT_DEPTH = 1;

interface OrgNodeCardProps {
  node: OrgTreeNode;
  depth: number;
  onOpen: (id: string) => void;
}

/** One person and, nested underneath, everyone who reports to them. */
export function OrgNodeCard({ node, depth, onOpen }: Readonly<OrgNodeCardProps>) {
  const t = useT();
  const [open, setOpen] = useState(depth <= OPEN_BY_DEFAULT_DEPTH);
  const hasReports = node.reports.length > 0;
  const subtitle = [node.designation, node.department].filter(Boolean).join(' · ');
  const size = teamSize(node);
  const toggleLabel = open
    ? t('collapse {name}', { name: node.name })
    : t('expand {name}', { name: node.name });
  const toggleIcon = open ? (
    <ExpandMoreIcon fontSize="small" />
  ) : (
    <ChevronRightIcon fontSize="small" />
  );

  return (
    <Box>
      <Flex direction="row" alignItems="center" spacing={0.5}>
        {hasReports ? (
          <IconButton
            size="small"
            aria-label={toggleLabel}
            onClick={() => setOpen((value) => !value)}
          >
            {toggleIcon}
          </IconButton>
        ) : (
          <Box sx={{ width: 34 }} />
        )}
        <ListItemButton
          onClick={() => onOpen(node.id)}
          sx={{ borderRadius: 1.5, py: 1, flexGrow: 1 }}
        >
          <Avatar
            src={node.avatarUrl ?? undefined}
            alt=""
            aria-hidden
            sx={{ width: 36, height: 36, mr: 1.5 }}
          >
            {initialsOf(node.name)}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Text weight="medium" noWrap>
              {node.name}
            </Text>
            <Text size="caption" color="text.secondary" noWrap>
              {subtitle || '—'}
            </Text>
          </Box>
          {hasReports && (
            <Chip size="small" label={t('{count} in team', { count: size })} sx={{ ml: 1 }} />
          )}
        </ListItemButton>
      </Flex>
      {hasReports && (
        <Collapse in={open} unmountOnExit>
          <Box sx={{ ml: 2, pl: 2, borderLeft: 1, borderColor: 'divider' }}>
            {node.reports.map((report) => (
              <OrgNodeCard key={report.id} node={report} depth={depth + 1} onOpen={onOpen} />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
