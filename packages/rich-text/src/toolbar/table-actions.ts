import type { ChainedCommands, Editor } from '@tiptap/core';

/** One entry in the table menu. `command` is applied to a chain for both `can()` and `run()`. */
export interface TableAction {
  key: string;
  label: string;
  command: (chain: ChainedCommands) => ChainedCommands;
  /** Draws a divider above the entry, grouping rows / columns / cells / table. */
  startsGroup?: boolean;
}

/** New tables start as 3 × 3 with a header row — the shape most article tables take. */
export const INSERT_TABLE: TableAction = {
  key: 'insertTable',
  label: 'Insert table (3 × 3)',
  command: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
};

export const TABLE_ACTIONS: readonly TableAction[] = [
  { key: 'addRowBefore', label: 'Insert row above', command: (c) => c.addRowBefore() },
  { key: 'addRowAfter', label: 'Insert row below', command: (c) => c.addRowAfter() },
  { key: 'deleteRow', label: 'Delete row', command: (c) => c.deleteRow() },
  {
    key: 'addColumnBefore',
    label: 'Insert column left',
    command: (c) => c.addColumnBefore(),
    startsGroup: true,
  },
  { key: 'addColumnAfter', label: 'Insert column right', command: (c) => c.addColumnAfter() },
  { key: 'deleteColumn', label: 'Delete column', command: (c) => c.deleteColumn() },
  { key: 'mergeCells', label: 'Merge cells', command: (c) => c.mergeCells(), startsGroup: true },
  { key: 'splitCell', label: 'Split cell', command: (c) => c.splitCell() },
  { key: 'toggleHeaderRow', label: 'Toggle header row', command: (c) => c.toggleHeaderRow() },
  {
    key: 'toggleHeaderColumn',
    label: 'Toggle header column',
    command: (c) => c.toggleHeaderColumn(),
  },
  { key: 'deleteTable', label: 'Delete table', command: (c) => c.deleteTable(), startsGroup: true },
];

/** Whether the action applies at the caret — a merge needs a multi-cell selection, etc. */
export const canRunTableAction = (editor: Editor, action: TableAction): boolean =>
  action.command(editor.can().chain().focus()).run();

export const runTableAction = (editor: Editor, action: TableAction): void => {
  action.command(editor.chain().focus()).run();
};
