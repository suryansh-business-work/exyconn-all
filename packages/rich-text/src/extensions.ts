import type { Extensions, ResizableNodeViewDirection } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import { CharacterCount, Placeholder } from '@tiptap/extensions';

/** Images resize from their corners only, so the aspect ratio has one obvious handle. */
const RESIZE_CORNERS: ResizableNodeViewDirection[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

/** Block types whose text can be aligned. */
const ALIGNABLE = ['heading', 'paragraph'];

/**
 * Everything the editor can express. StarterKit brings paragraphs, headings, the
 * marks (bold, italic, underline, strike, code), lists, blockquote, code block,
 * horizontal rule, links and undo history; the rest is added here. The schema is
 * also the sanitiser: markup outside it never survives a load.
 */
export function buildExtensions(placeholder: string): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['mailto', 'tel'],
      },
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ALIGNABLE }),
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: true } }),
    Image.configure({
      resize: { enabled: true, directions: RESIZE_CORNERS, alwaysPreserveAspectRatio: true },
    }),
    Placeholder.configure({ placeholder }),
    CharacterCount,
  ];
}
