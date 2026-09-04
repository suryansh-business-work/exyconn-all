import { useState } from 'react';
import {
  Box,
  Collapse,
  Flex,
  IconButton,
  ListItemButton,
  Text,
} from '@exyconn/shell/components/ui';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import type { DocNode } from './doc-tree';

interface DocTreeProps {
  nodes: DocNode[];
  selectedId: string | null;
  depth?: number;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

/**
 * The page tree beside a space, the way a wiki reads: a page, the pages filed under it, and
 * a `+` on each row that files a new page under that one. Branches start expanded — a tree
 * that hides where you were is a tree you navigate twice.
 */
export function DocTree({
  nodes,
  selectedId,
  depth = 0,
  onSelect,
  onAddChild,
}: Readonly<DocTreeProps>) {
  return (
    <Box>
      {nodes.map((node) => (
        <DocTreeRow
          key={node.page.id}
          node={node}
          depth={depth}
          selectedId={selectedId}
          onSelect={onSelect}
          onAddChild={onAddChild}
        />
      ))}
    </Box>
  );
}

interface DocTreeRowProps {
  node: DocNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

/** One row of the tree: its own disclosure, its title, and its "add child" button. */
function DocTreeRow({ node, depth, selectedId, onSelect, onAddChild }: Readonly<DocTreeRowProps>) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <Box>
      <Flex direction="row" alignItems="center">
        <IconButton
          size="small"
          aria-label={open ? `Collapse ${node.page.title}` : `Expand ${node.page.title}`}
          disabled={!hasChildren}
          onClick={() => setOpen((was) => !was)}
          sx={{ ml: depth * 1.5, visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {open ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>

        <ListItemButton
          selected={node.page.id === selectedId}
          onClick={() => onSelect(node.page.id)}
          sx={{ borderRadius: 1, py: 0.5, minWidth: 0 }}
        >
          <ArticleOutlinedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Text size="sm" noWrap>
            {node.page.title}
          </Text>
        </ListItemButton>

        <IconButton
          size="small"
          aria-label={`Add a page under ${node.page.title}`}
          onClick={() => onAddChild(node.page.id)}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Flex>

      {hasChildren ? (
        <Collapse in={open} unmountOnExit>
          <DocTree
            nodes={node.children}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onAddChild={onAddChild}
          />
        </Collapse>
      ) : null}
    </Box>
  );
}
