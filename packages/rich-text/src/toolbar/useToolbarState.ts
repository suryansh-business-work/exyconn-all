import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { activeBlockType } from './block-types';
import { ALIGN_ACTIONS, BLOCK_ACTIONS, MARK_ACTIONS } from './toolbar.config';

const TOGGLES = [...MARK_ACTIONS, ...ALIGN_ACTIONS, ...BLOCK_ACTIONS].filter(
  (action) => action.isActive,
);

export interface ToolbarState {
  /** Pressed state of every toggle button, keyed by its action key. */
  active: Record<string, boolean>;
  blockType: string;
  canUndo: boolean;
  canRedo: boolean;
  inTable: boolean;
  inLink: boolean;
  textColor: string;
  highlight: string;
}

const selectState = (editor: Editor): ToolbarState => ({
  active: Object.fromEntries(
    TOGGLES.map((action) => [action.key, action.isActive?.(editor) ?? false]),
  ),
  blockType: activeBlockType(editor),
  canUndo: editor.can().undo(),
  canRedo: editor.can().redo(),
  inTable: editor.isActive('table'),
  inLink: editor.isActive('link'),
  textColor: editor.getAttributes('textStyle').color ?? '',
  highlight: editor.getAttributes('highlight').color ?? '',
});

/**
 * Toolbar state, recomputed per transaction. TipTap v3 does not re-render on every
 * transaction, so without this the pressed states go stale as the caret moves; the
 * default deep-equality check keeps it from re-rendering when nothing changed.
 */
export function useToolbarState(editor: Editor): ToolbarState {
  return useEditorState({ editor, selector: ({ editor: instance }) => selectState(instance) });
}
