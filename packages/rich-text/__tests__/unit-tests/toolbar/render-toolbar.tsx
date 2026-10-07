import { vi } from 'vitest';
import type { Editor } from '@tiptap/core';
import { render } from '@testing-library/react';
import { Toolbar } from '../../../src/toolbar/Toolbar';

/** Renders the toolbar over a headless editor, with spies for the callbacks it hands back. */
export function renderToolbar(editor: Editor, sourceMode = false) {
  const callbacks = { onToggleSource: vi.fn(), onOpenLink: vi.fn(), onOpenImage: vi.fn() };
  const view = render(<Toolbar editor={editor} sourceMode={sourceMode} {...callbacks} />);
  return { ...callbacks, view };
}
