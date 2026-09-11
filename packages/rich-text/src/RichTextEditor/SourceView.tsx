import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { TextField } from '@exyconn/ui';

interface SourceViewProps {
  editor: Editor;
  label: string;
  minHeight: number;
}

/**
 * The document as editable HTML. Every keystroke is loaded back into the editor, so
 * the form value stays the editor's normalised HTML — markup the schema does not
 * know is dropped the same way a paste would drop it. The draft keeps what was typed.
 */
export function SourceView({ editor, label, minHeight }: Readonly<SourceViewProps>) {
  const [draft, setDraft] = useState(() => editor.getHTML());

  return (
    <TextField
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        editor.commands.setContent(event.target.value, { emitUpdate: true });
      }}
      multiline
      fullWidth
      variant="standard"
      slotProps={{
        input: { disableUnderline: true },
        htmlInput: { 'aria-label': `${label} (HTML source)`, spellCheck: false },
      }}
      sx={{
        '& .MuiInputBase-root': {
          minHeight,
          alignItems: 'flex-start',
          p: 1.5,
          fontFamily: 'monospace',
          fontSize: 13,
        },
      }}
    />
  );
}
