import type { Editor } from '@tiptap/core';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { Box, Divider, Flex } from '@exyconn/ui';
import { ActionGroup } from './ActionGroup';
import { BlockTypeSelect } from './BlockTypeSelect';
import { ColorMenu } from './ColorMenu';
import { TableMenu } from './TableMenu';
import { ToolbarButton } from './ToolbarButton';
import { HIGHLIGHT_SWATCHES, TEXT_SWATCHES } from './color-palette';
import { ALIGN_ACTIONS, BLOCK_ACTIONS, MARK_ACTIONS } from './toolbar.config';
import { useToolbarState } from './useToolbarState';

interface ToolbarProps {
  editor: Editor;
  /** The HTML source is showing: every formatting control is disabled. */
  sourceMode: boolean;
  onToggleSource: () => void;
  onOpenLink: () => void;
  onOpenImage: () => void;
}

const Separator = () => <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />;

/** The formatting toolbar: history, block type, marks, colour, alignment, blocks, inserts, source. */
export function Toolbar({
  editor,
  sourceMode,
  onToggleSource,
  onOpenLink,
  onOpenImage,
}: Readonly<ToolbarProps>) {
  const state = useToolbarState(editor);
  const chain = () => editor.chain().focus();

  return (
    <Flex
      wrap
      alignItems="center"
      gap={0.25}
      role="toolbar"
      aria-label="Formatting"
      sx={{ p: 0.5, borderBottom: 1, borderColor: 'divider' }}
    >
      <ToolbarButton
        label="Undo"
        disabled={sourceMode || !state.canUndo}
        onClick={() => chain().undo().run()}
      >
        <UndoIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={sourceMode || !state.canRedo}
        onClick={() => chain().redo().run()}
      >
        <RedoIcon fontSize="small" />
      </ToolbarButton>
      <Separator />
      <BlockTypeSelect editor={editor} value={state.blockType} disabled={sourceMode} />
      <Separator />
      <ActionGroup
        editor={editor}
        actions={MARK_ACTIONS}
        active={state.active}
        disabled={sourceMode}
      />
      <ColorMenu
        label="Text colour"
        icon={<FormatColorTextIcon fontSize="small" />}
        swatches={TEXT_SWATCHES}
        current={state.textColor}
        disabled={sourceMode}
        onPick={(value) => chain().setColor(value).run()}
        onClear={() => chain().unsetColor().run()}
      />
      <ColorMenu
        label="Highlight"
        icon={<BorderColorIcon fontSize="small" />}
        swatches={HIGHLIGHT_SWATCHES}
        current={state.highlight}
        disabled={sourceMode}
        onPick={(value) => chain().setHighlight({ color: value }).run()}
        onClear={() => chain().unsetHighlight().run()}
      />
      <Separator />
      <ActionGroup
        editor={editor}
        actions={ALIGN_ACTIONS}
        active={state.active}
        disabled={sourceMode}
      />
      <Separator />
      <ActionGroup
        editor={editor}
        actions={BLOCK_ACTIONS}
        active={state.active}
        disabled={sourceMode}
      />
      <Separator />
      <ToolbarButton label="Link" active={state.inLink} disabled={sourceMode} onClick={onOpenLink}>
        <InsertLinkIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        label="Remove link"
        disabled={sourceMode || !state.inLink}
        onClick={() => chain().extendMarkRange('link').unsetLink().run()}
      >
        <LinkOffIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton label="Image" disabled={sourceMode} onClick={onOpenImage}>
        <InsertPhotoIcon fontSize="small" />
      </ToolbarButton>
      <TableMenu editor={editor} inTable={state.inTable} disabled={sourceMode} />
      <Box sx={{ flexGrow: 1 }} />
      <ToolbarButton label="HTML source" active={sourceMode} onClick={onToggleSource}>
        <DataObjectIcon fontSize="small" />
      </ToolbarButton>
    </Flex>
  );
}
