import type { Editor } from '@tiptap/core';

type HeadingLevel = 1 | 2 | 3 | 4;

/** An entry in the block-type picker: what the caret's block is, and how to turn it into that. */
export interface BlockType {
  value: string;
  label: string;
  isActive: (editor: Editor) => boolean;
  apply: (editor: Editor) => void;
}

const heading = (level: HeadingLevel): BlockType => ({
  value: `h${level}`,
  label: `Heading ${level}`,
  isActive: (e) => e.isActive('heading', { level }),
  apply: (e) => e.chain().focus().setHeading({ level }).run(),
});

export const BLOCK_TYPES: readonly BlockType[] = [
  {
    value: 'paragraph',
    label: 'Paragraph',
    isActive: (e) => e.isActive('paragraph'),
    apply: (e) => e.chain().focus().setParagraph().run(),
  },
  heading(1),
  heading(2),
  heading(3),
  heading(4),
  {
    value: 'codeBlock',
    label: 'Code block',
    isActive: (e) => e.isActive('codeBlock'),
    apply: (e) => e.chain().focus().setCodeBlock().run(),
  },
];

/** The picker's value for the caret's block; `''` inside blocks it does not list (a table cell's list). */
export function activeBlockType(editor: Editor): string {
  return BLOCK_TYPES.find((type) => type.isActive(editor))?.value ?? '';
}
