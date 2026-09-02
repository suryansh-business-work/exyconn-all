import type { ReactNode } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import { Flex, IconButton, Tooltip } from '@/components/ui';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

interface ToolbarButtonProps {
  label: string;
  /** Toggle state — omitted for one-shot commands (undo/redo), which are not toggles. */
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** One MUI icon button in the rich-text toolbar (TipTap ships headless). */
function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: Readonly<ToolbarButtonProps>) {
  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          size="small"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          color={active ? 'primary' : 'default'}
          onClick={onClick}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

interface RichTextToolbarProps {
  editor: Editor;
}

/**
 * Formatting toolbar for `RhfRichText`. Subscribes to the editor through
 * `useEditorState` — TipTap v3 does not re-render on every transaction, so the
 * active/undo states would otherwise go stale as the caret moves.
 */
export function RichTextToolbar({ editor }: Readonly<RichTextToolbarProps>) {
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      bold: instance.isActive('bold'),
      italic: instance.isActive('italic'),
      bulletList: instance.isActive('bulletList'),
      orderedList: instance.isActive('orderedList'),
      canUndo: instance.can().undo(),
      canRedo: instance.can().redo(),
    }),
  });

  return (
    <Flex
      direction="row"
      spacing={0.25}
      sx={{ p: 0.5, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}
    >
      <ToolbarButton
        label="Bold"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <FormatBoldIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <FormatItalicIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <FormatListBulletedIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <FormatListNumberedIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        label="Undo"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <UndoIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <RedoIcon fontSize="small" />
      </ToolbarButton>
    </Flex>
  );
}
