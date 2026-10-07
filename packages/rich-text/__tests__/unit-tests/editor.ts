import { afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { buildExtensions } from '../../src/extensions';

/**
 * A headless editor with the package's extensions, destroyed after each test. Returns the
 * factory; every editor it makes is cleaned up.
 */
export function editorFactory(): (content: string) => Editor {
  const made: Editor[] = [];
  afterEach(() => {
    for (const editor of made.splice(0)) {
      editor.destroy();
    }
  });
  return (content) => {
    const editor = new Editor({ extensions: buildExtensions(''), content });
    made.push(editor);
    return editor;
  };
}
