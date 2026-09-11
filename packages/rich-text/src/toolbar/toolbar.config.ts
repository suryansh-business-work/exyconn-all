import type { Editor } from '@tiptap/core';
import type { SvgIconComponent } from '@mui/icons-material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import CodeIcon from '@mui/icons-material/Code';
import SubscriptIcon from '@mui/icons-material/Subscript';
import SuperscriptIcon from '@mui/icons-material/Superscript';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ChecklistIcon from '@mui/icons-material/Checklist';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import FormatClearIcon from '@mui/icons-material/FormatClear';

/**
 * One toolbar button. `isActive` is omitted for one-shot commands (a rule, clear
 * formatting), which are not toggles and must not report `aria-pressed`.
 */
export interface ToolbarAction {
  key: string;
  label: string;
  icon: SvgIconComponent;
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
}

const chain = (editor: Editor) => editor.chain().focus();

export const MARK_ACTIONS: readonly ToolbarAction[] = [
  {
    key: 'bold',
    label: 'Bold',
    icon: FormatBoldIcon,
    run: (e) => chain(e).toggleBold().run(),
    isActive: (e) => e.isActive('bold'),
  },
  {
    key: 'italic',
    label: 'Italic',
    icon: FormatItalicIcon,
    run: (e) => chain(e).toggleItalic().run(),
    isActive: (e) => e.isActive('italic'),
  },
  {
    key: 'underline',
    label: 'Underline',
    icon: FormatUnderlinedIcon,
    run: (e) => chain(e).toggleUnderline().run(),
    isActive: (e) => e.isActive('underline'),
  },
  {
    key: 'strike',
    label: 'Strikethrough',
    icon: StrikethroughSIcon,
    run: (e) => chain(e).toggleStrike().run(),
    isActive: (e) => e.isActive('strike'),
  },
  {
    key: 'code',
    label: 'Inline code',
    icon: CodeIcon,
    run: (e) => chain(e).toggleCode().run(),
    isActive: (e) => e.isActive('code'),
  },
  {
    key: 'subscript',
    label: 'Subscript',
    icon: SubscriptIcon,
    run: (e) => chain(e).toggleSubscript().run(),
    isActive: (e) => e.isActive('subscript'),
  },
  {
    key: 'superscript',
    label: 'Superscript',
    icon: SuperscriptIcon,
    run: (e) => chain(e).toggleSuperscript().run(),
    isActive: (e) => e.isActive('superscript'),
  },
];

const alignAction = (
  value: 'left' | 'center' | 'right' | 'justify',
  label: string,
  icon: SvgIconComponent,
): ToolbarAction => ({
  key: `align-${value}`,
  label,
  icon,
  run: (e) => chain(e).setTextAlign(value).run(),
  isActive: (e) => e.isActive({ textAlign: value }),
});

export const ALIGN_ACTIONS: readonly ToolbarAction[] = [
  alignAction('left', 'Align left', FormatAlignLeftIcon),
  alignAction('center', 'Align centre', FormatAlignCenterIcon),
  alignAction('right', 'Align right', FormatAlignRightIcon),
  alignAction('justify', 'Justify', FormatAlignJustifyIcon),
];

export const BLOCK_ACTIONS: readonly ToolbarAction[] = [
  {
    key: 'bulletList',
    label: 'Bullet list',
    icon: FormatListBulletedIcon,
    run: (e) => chain(e).toggleBulletList().run(),
    isActive: (e) => e.isActive('bulletList'),
  },
  {
    key: 'orderedList',
    label: 'Numbered list',
    icon: FormatListNumberedIcon,
    run: (e) => chain(e).toggleOrderedList().run(),
    isActive: (e) => e.isActive('orderedList'),
  },
  {
    key: 'taskList',
    label: 'Checklist',
    icon: ChecklistIcon,
    run: (e) => chain(e).toggleTaskList().run(),
    isActive: (e) => e.isActive('taskList'),
  },
  {
    key: 'blockquote',
    label: 'Quote',
    icon: FormatQuoteIcon,
    run: (e) => chain(e).toggleBlockquote().run(),
    isActive: (e) => e.isActive('blockquote'),
  },
  {
    key: 'horizontalRule',
    label: 'Divider',
    icon: HorizontalRuleIcon,
    run: (e) => chain(e).setHorizontalRule().run(),
  },
  {
    key: 'clear',
    label: 'Clear formatting',
    icon: FormatClearIcon,
    run: (e) => chain(e).unsetAllMarks().clearNodes().run(),
  },
];
