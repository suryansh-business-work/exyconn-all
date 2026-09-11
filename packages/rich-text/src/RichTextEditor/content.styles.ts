import type { Theme } from '@exyconn/ui';

/**
 * Styles for the ProseMirror surface. TipTap is headless, so every block the schema
 * allows — tables and their resize handles, task lists, images, code — is styled here.
 */
export function contentStyles(minHeight: number) {
  return {
    '& .tiptap': {
      minHeight,
      p: 1.5,
      outline: 'none',
      fontSize: 15,
      lineHeight: 1.6,
      overflowWrap: 'anywhere',
    },
    '& .tiptap > :first-child': { mt: 0 },
    '& .tiptap > :last-child': { mb: 0 },
    '& .tiptap p': { my: 1 },
    '& .tiptap h1': { fontSize: '1.9rem', fontWeight: 700, mt: 3, mb: 1 },
    '& .tiptap h2': { fontSize: '1.5rem', fontWeight: 700, mt: 2.5, mb: 1 },
    '& .tiptap h3': { fontSize: '1.25rem', fontWeight: 600, mt: 2, mb: 1 },
    '& .tiptap h4': { fontSize: '1.05rem', fontWeight: 600, mt: 2, mb: 1 },
    '& .tiptap ul, & .tiptap ol': { my: 1, pl: 3 },
    '& .tiptap a': { color: 'primary.main', textDecoration: 'underline' },
    '& .tiptap blockquote': {
      my: 2,
      mx: 0,
      pl: 2,
      borderLeft: 4,
      borderColor: 'primary.light',
      color: 'text.secondary',
    },
    '& .tiptap code': {
      px: 0.5,
      borderRadius: 0.5,
      bgcolor: 'action.hover',
      fontFamily: 'monospace',
      fontSize: '0.9em',
    },
    '& .tiptap pre': {
      p: 1.5,
      borderRadius: 1,
      bgcolor: 'grey.900',
      color: 'grey.100',
      overflowX: 'auto',
      '& code': { p: 0, bgcolor: 'transparent', color: 'inherit' },
    },
    '& .tiptap hr': { my: 2, border: 0, borderTop: 1, borderColor: 'divider' },
    '& .tiptap mark': { borderRadius: 0.5, px: 0.25, color: 'inherit' },
    '& .tiptap img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
    '& .tiptap img.ProseMirror-selectednode, & .tiptap .ProseMirror-selectednode img': {
      outline: (theme: Theme) => `2px solid ${theme.palette.primary.main}`,
    },
    '& .tiptap [data-resize-handle]': {
      width: 10,
      height: 10,
      borderRadius: 0.5,
      bgcolor: 'primary.main',
      opacity: 0,
      zIndex: 1,
    },
    '& .tiptap [data-resize-handle^="top"]': { mt: -0.625 },
    '& .tiptap [data-resize-handle^="bottom"]': { mb: -0.625 },
    '& .tiptap [data-resize-handle$="left"]': { ml: -0.625, cursor: 'nesw-resize' },
    '& .tiptap [data-resize-handle$="right"]': { mr: -0.625, cursor: 'nwse-resize' },
    '& .tiptap [data-resize-container]:hover [data-resize-handle], & .tiptap .ProseMirror-selectednode [data-resize-handle]':
      { opacity: 1 },
    '& .tiptap ul[data-type="taskList"]': {
      listStyle: 'none',
      pl: 0.5,
      '& li': { display: 'flex', gap: 1, alignItems: 'flex-start' },
      '& li > label': { flex: '0 0 auto', mt: 0.25 },
      '& li > div': { flex: '1 1 auto' },
      '& li > div > p': { my: 0 },
    },
    '& .tiptap .tableWrapper': { my: 2, overflowX: 'auto' },
    '& .tiptap table': { borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' },
    '& .tiptap th, & .tiptap td': {
      position: 'relative',
      minWidth: 48,
      p: 1,
      border: 1,
      borderColor: 'divider',
      verticalAlign: 'top',
      '& > p': { my: 0 },
    },
    '& .tiptap th': { bgcolor: 'action.hover', fontWeight: 600, textAlign: 'left' },
    '& .tiptap .selectedCell::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      bgcolor: 'action.selected',
    },
    '& .tiptap .column-resize-handle': {
      position: 'absolute',
      top: 0,
      right: -2,
      bottom: 0,
      width: 4,
      bgcolor: 'primary.main',
      pointerEvents: 'none',
    },
    '& .tiptap.resize-cursor': { cursor: 'col-resize' },
    '& .tiptap p.is-editor-empty:first-of-type::before': {
      content: 'attr(data-placeholder)',
      float: 'left',
      height: 0,
      color: 'text.disabled',
      pointerEvents: 'none',
    },
  };
}
