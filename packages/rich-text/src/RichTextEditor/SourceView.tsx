import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { CodeEditor } from '@exyconn/code-editor';

interface SourceViewProps {
  editor: Editor;
  label: string;
  minHeight: number;
}

/**
 * The document as editable HTML, in the code editor (highlighting, Format, tag check). Every
 * edit is loaded back into the editor, so the form value stays the editor's normalised HTML —
 * markup the schema does not know is dropped the same way a paste would drop it. The draft
 * keeps what was typed.
 */
export function SourceView({ editor, label, minHeight }: Readonly<SourceViewProps>) {
  const [draft, setDraft] = useState(() => editor.getHTML());

  return (
    <CodeEditor
      value={draft}
      onChange={(next) => {
        setDraft(next);
        editor.commands.setContent(next, { emitUpdate: true });
      }}
      language="html"
      label={`${label} (HTML source)`}
      height={minHeight}
    />
  );
}
