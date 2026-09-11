import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Divider, Menu, MenuItem } from '@exyconn/ui';
import { ToolbarButton } from './ToolbarButton';
import {
  INSERT_TABLE,
  TABLE_ACTIONS,
  canRunTableAction,
  runTableAction,
  type TableAction,
} from './table-actions';

interface TableMenuProps {
  editor: Editor;
  /** The caret is inside a table: the menu edits it instead of inserting one. */
  inTable: boolean;
  disabled: boolean;
}

/**
 * The table button. Outside a table it inserts one; inside, it lists the row, column,
 * cell and table operations, each disabled when it cannot apply at the caret.
 */
export function TableMenu({ editor, inTable, disabled }: Readonly<TableMenuProps>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const actions = inTable ? TABLE_ACTIONS : [INSERT_TABLE];
  const open = Boolean(anchor);

  const run = (action: TableAction) => {
    runTableAction(editor, action);
    setAnchor(null);
  };

  return (
    <>
      <ToolbarButton
        label="Table"
        hasPopup
        active={inTable}
        disabled={disabled}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <TableChartIcon fontSize="small" />
      </ToolbarButton>
      {/* MUI's Menu cannot take Fragments, so each group divider is a sibling item. */}
      <Menu anchorEl={anchor} open={open} onClose={() => setAnchor(null)}>
        {open &&
          actions.flatMap((action) => [
            action.startsGroup ? <Divider key={`${action.key}-divider`} /> : null,
            <MenuItem
              key={action.key}
              dense
              disabled={!canRunTableAction(editor, action)}
              onClick={() => run(action)}
            >
              {action.label}
            </MenuItem>,
          ])}
      </Menu>
    </>
  );
}
