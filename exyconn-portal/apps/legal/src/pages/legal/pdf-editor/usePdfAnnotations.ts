import { useCallback, useState } from 'react';
import {
  PDF_FONT_SIZES,
  PDF_INKS,
  type PdfAnnotation,
  type PdfStamp,
  type PdfTool,
} from './pdf-editor.types';

/** A fresh id for an annotation; only needs to be unique within one editing session. */
export const newAnnotationId = () => globalThis.crypto.randomUUID();

/**
 * The editor's state: the annotations, the one selected, the tool and the pen. Every change
 * to the annotations keeps the previous list, so Undo walks back one step at a time.
 */
export function usePdfAnnotations() {
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [history, setHistory] = useState<PdfAnnotation[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<PdfTool>('select');
  const [color, setColor] = useState<string>(PDF_INKS[0].value);
  const [fontSize, setFontSize] = useState<number>(PDF_FONT_SIZES[1]);
  /** The picture the Image or Signature tool will place on the next click. */
  const [stamp, setStamp] = useState<PdfStamp | null>(null);
  /** The text box being typed into, if any. */
  const [editingId, setEditingId] = useState<string | null>(null);

  const commit = useCallback(
    (next: PdfAnnotation[]) => {
      setHistory((past) => [...past, annotations]);
      setAnnotations(next);
    },
    [annotations],
  );

  const add = (annotation: PdfAnnotation) => {
    commit([...annotations, annotation]);
    setSelectedId(annotation.id);
  };

  const update = (id: string, patch: Partial<PdfAnnotation>) =>
    commit(annotations.map((a) => (a.id === id ? ({ ...a, ...patch } as PdfAnnotation) : a)));

  const remove = (id: string) => {
    commit(annotations.filter((a) => a.id !== id));
    setSelectedId(null);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (previous) {
      setAnnotations(previous);
      setHistory(history.slice(0, -1));
      setSelectedId(null);
    }
  };

  return {
    annotations,
    selectedId,
    setSelectedId,
    tool,
    setTool,
    color,
    setColor,
    fontSize,
    setFontSize,
    stamp,
    setStamp,
    editingId,
    setEditingId,
    add,
    update,
    remove,
    undo,
    canUndo: history.length > 0,
  };
}

export type PdfAnnotationsApi = ReturnType<typeof usePdfAnnotations>;
