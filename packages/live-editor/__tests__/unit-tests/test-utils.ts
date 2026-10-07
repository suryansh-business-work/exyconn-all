import grapesjs, { type Editor, type EditorConfig } from 'grapesjs';
import { afterEach } from 'vitest';

let mounted: Editor[] = [];

/**
 * A real headless GrapesJS editor on a fresh container, destroyed after each test.
 * Use it for plugins, component types, blocks and readDesign; mock `grapesjs` for the
 * React hook, whose non-headless init needs a canvas jsdom does not provide.
 */
export const headlessEditor = (config: Readonly<EditorConfig> = {}): Editor => {
  const container = document.createElement('div');
  document.body.append(container);
  const editor = grapesjs.init({
    container,
    headless: true,
    storageManager: false,
    selectorManager: { componentFirst: true },
    ...config,
  });
  mounted.push(editor);
  return editor;
};

afterEach(() => {
  mounted.forEach((editor) => editor.destroy());
  mounted = [];
  document.body.innerHTML = '';
});
