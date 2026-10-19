import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Button,
  Divider,
  Flex,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import { BlockFields } from './BlockFields';
import { newBlock, type Block, type BlockType, type Design } from './blocks';
import type { StudioOptions } from '../studio/useStudioOptions';

const BLOCK_LABELS: Readonly<Record<BlockType, string>> = {
  header: 'Header',
  text: 'Text',
  image: 'Image',
  button: 'Button',
  columns: 'Two columns',
  divider: 'Divider',
  spacer: 'Spacer',
  footer: 'Footer with unsubscribe',
};

interface VisualEditorProps {
  design: Design;
  onChange: (design: Design) => void;
  variables: StudioOptions['variables'];
}

/** A block's one-line summary in the list. */
const summaryOf = (block: Block): string => {
  if (block.type === 'text') return block.content.slice(0, 60);
  if (block.type === 'header') return block.title;
  if (block.type === 'button') return block.label;
  if (block.type === 'image') return block.alt || block.src;
  return '';
};

/** Page-wide branding: backgrounds, typeface, width, link colour. */
function DesignSettingsFields({
  design,
  onChange,
}: Readonly<Pick<VisualEditorProps, 'design' | 'onChange'>>) {
  const t = useT();
  const set = (changes: Partial<Design['settings']>) =>
    onChange({ ...design, settings: { ...design.settings, ...changes } });
  return (
    <Flex direction="row" gap={2} flexWrap="wrap">
      <TextField
        type="color"
        label={t('Page background')}
        value={design.settings.pageBackground}
        onChange={(e) => set({ pageBackground: e.target.value })}
      />
      <TextField
        type="color"
        label={t('Content background')}
        value={design.settings.contentBackground}
        onChange={(e) => set({ contentBackground: e.target.value })}
      />
      <TextField
        type="color"
        label={t('Link colour')}
        value={design.settings.linkColor}
        onChange={(e) => set({ linkColor: e.target.value })}
      />
      <TextField
        label={t('Font family')}
        value={design.settings.fontFamily}
        onChange={(e) => set({ fontFamily: e.target.value })}
        sx={{ minWidth: 220 }}
      />
    </Flex>
  );
}

/**
 * The block editor: add, order and edit sections; the MJML is generated from it. Every block
 * carries its own background and padding; text fields take variables at the caret.
 */
export function VisualEditor({ design, onChange, variables }: Readonly<VisualEditorProps>) {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string | null>(design.blocks[0]?.id ?? null);
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const blocks = design.blocks;
  const selected = blocks.find((block) => block.id === selectedId) ?? null;
  const setBlocks = (next: Block[]) => onChange({ ...design, blocks: next });

  const add = (type: BlockType) => {
    const block = newBlock(type);
    const at = selected ? blocks.indexOf(selected) + 1 : blocks.length;
    setBlocks([...blocks.slice(0, at), block, ...blocks.slice(at)]);
    setSelectedId(block.id);
    setMenu(null);
  };
  const move = (index: number, by: number) => {
    const next = [...blocks];
    const [block] = next.splice(index, 1);
    next.splice(index + by, 0, block);
    setBlocks(next);
  };
  const remove = (id: string) => setBlocks(blocks.filter((block) => block.id !== id));

  return (
    <Flex direction="column" spacing={2}>
      <DesignSettingsFields design={design} onChange={onChange} />
      <Divider />
      <List dense aria-label={t('Email blocks')}>
        {blocks.map((block, index) => (
          <ListItem
            key={block.id}
            disablePadding
            secondaryAction={
              <Flex direction="row">
                <IconButton
                  size="small"
                  aria-label={t('Move {block} up', { block: t(BLOCK_LABELS[block.type]) })}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={t('Move {block} down', { block: t(BLOCK_LABELS[block.type]) })}
                  disabled={index === blocks.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={t('Remove {block}', { block: t(BLOCK_LABELS[block.type]) })}
                  onClick={() => remove(block.id)}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Flex>
            }
          >
            <ListItemButton
              selected={block.id === selectedId}
              onClick={() => setSelectedId(block.id)}
              sx={{ pr: 16 }}
            >
              <ListItemText primary={t(BLOCK_LABELS[block.type])} secondary={summaryOf(block)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={(event) => setMenu(event.currentTarget)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Add block')}
      </Button>
      <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {(Object.keys(BLOCK_LABELS) as BlockType[]).map((type) => (
          <MenuItem key={type} onClick={() => add(type)}>
            {t(BLOCK_LABELS[type])}
          </MenuItem>
        ))}
      </Menu>
      <Divider />
      {selected ? (
        <BlockFields
          key={selected.id}
          block={selected}
          variables={variables}
          onChange={(block) =>
            setBlocks(blocks.map((entry) => (entry.id === block.id ? block : entry)))
          }
        />
      ) : (
        <Text size="sm" color="text.secondary">
          {t('Select a block to edit it.')}
        </Text>
      )}
    </Flex>
  );
}
