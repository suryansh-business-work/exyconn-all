import { useEffect, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { buildExtensions } from '../extensions';
import type { RichTextEditorProps } from '../types';
import { imageFilesOf, insertUploadedImages } from './image-files';

type EditorCallbacks = Pick<RichTextEditorProps, 'onChange' | 'onBlur' | 'uploadImage'>;

interface UseRichTextEditorOptions extends EditorCallbacks {
  value: string;
  label: string;
  placeholder: string;
}

/** Pasted / dropped images in flight, and the last upload failure. */
export interface UploadStatus {
  pending: number;
  error: string | null;
  dismissError: () => void;
}

/** The HTML the form stores: `''` for an empty document, so a `min(1)` rule catches it. */
export const editorHtml = (editor: Editor): string => (editor.isEmpty ? '' : editor.getHTML());

/**
 * Owns the TipTap instance: the extensions, change / blur reporting, image paste and
 * drop (uploaded through the host), and re-sync when the value changes from outside
 * (a form `reset()`). The editor is created once, so the latest callbacks are read
 * through a ref rather than captured.
 */
export function useRichTextEditor({
  value,
  label,
  placeholder,
  ...callbacks
}: UseRichTextEditorOptions) {
  const latest = useRef<EditorCallbacks>(callbacks);
  useEffect(() => {
    latest.current = callbacks;
  });
  // The paste / drop handlers are bound once, when the editor is created.
  const editorRef = useRef<Editor | null>(null);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadDropped = (files: File[], position?: number): boolean => {
    const target = editorRef.current;
    if (!target || files.length === 0) {
      return false;
    }
    setPending((count) => count + files.length);
    for (const upload of insertUploadedImages(
      target,
      files,
      latest.current.uploadImage,
      position,
    )) {
      upload
        .catch((cause: unknown) =>
          setError(cause instanceof Error ? cause.message : 'Upload failed'),
        )
        .finally(() => setPending((count) => count - 1));
    }
    return true;
  };

  const editor = useEditor({
    extensions: buildExtensions(placeholder),
    content: value,
    onUpdate: ({ editor: instance }) => latest.current.onChange(editorHtml(instance)),
    onBlur: () => latest.current.onBlur?.(),
    editorProps: {
      attributes: { 'aria-label': label, 'aria-multiline': 'true', role: 'textbox' },
      handlePaste: (_view, event) => uploadDropped(imageFilesOf(event.clipboardData)),
      handleDrop: (view, event) =>
        uploadDropped(
          imageFilesOf(event.dataTransfer),
          view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos,
        ),
    },
  });
  editorRef.current = editor;

  // Re-sync when the value changes outside the editor (e.g. `reset()` on cancel or
  // after a save). Typing is a no-op here: the value already matches.
  useEffect(() => {
    if (editorHtml(editor) !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const status: UploadStatus = { pending, error, dismissError: () => setError(null) };
  return { editor, status };
}
