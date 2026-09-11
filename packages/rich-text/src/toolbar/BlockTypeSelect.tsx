import type { Editor } from '@tiptap/core';
import { MenuItem, Select } from '@exyconn/ui';
import { BLOCK_TYPES } from './block-types';

interface BlockTypeSelectProps {
  editor: Editor;
  value: string;
  disabled: boolean;
}

/** Paragraph / heading / code-block picker for the caret's block. */
export function BlockTypeSelect({ editor, value, disabled }: Readonly<BlockTypeSelectProps>) {
  return (
    <Select
      size="small"
      value={value}
      disabled={disabled}
      displayEmpty
      inputProps={{ 'aria-label': 'Block type' }}
      renderValue={(selected) =>
        BLOCK_TYPES.find((type) => type.value === selected)?.label ?? 'Mixed'
      }
      onChange={(event) =>
        BLOCK_TYPES.find((type) => type.value === event.target.value)?.apply(editor)
      }
      sx={{ minWidth: 136, fontSize: 14, '& .MuiSelect-select': { py: 0.5 } }}
    >
      {BLOCK_TYPES.map((type) => (
        <MenuItem key={type.value} value={type.value} dense>
          {type.label}
        </MenuItem>
      ))}
    </Select>
  );
}
