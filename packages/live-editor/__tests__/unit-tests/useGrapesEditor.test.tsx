import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Editor, EditorConfig } from 'grapesjs';
import { readDesign, useGrapesEditor } from '../../src/useGrapesEditor';
import { ARTICLE_BLOCKS } from '../../src/blocks';
import { DEVICES } from '../../src/devices';
import type { LiveEditorProps } from '../../src/types';
import { fakeEditor, type FakeEditor } from './grapes-fake';

const grapes = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock('grapesjs', () => ({ default: { init: grapes.init } }));

let editors: FakeEditor[] = [];

beforeEach(() => {
  grapes.init.mockImplementation((config: EditorConfig) => {
    const fake = fakeEditor(config);
    editors.push(fake);
    return fake.editor;
  });
});

afterEach(() => {
  editors = [];
  grapes.init.mockReset();
  document.head.querySelectorAll('style[data-live-editor]').forEach((style) => style.remove());
});

const baseOptions = () => ({
  initial: { html: '<p>Start</p>', css: 'p{margin:0}' },
  canvasStyles: ['https://exyconn.com/site.css'],
  canvasClass: 'article-body',
  uploadImage: vi.fn(async () => 'https://ik.imagekit.io/x/a.png'),
  onError: vi.fn(),
  onDirty: vi.fn(),
});

const mount = (options: Partial<Omit<LiveEditorProps, 'ref'>> = {}) => {
  const container = { current: document.createElement('div') };
  return renderHook(() => useGrapesEditor(container, { ...baseOptions(), ...options }));
};

describe('useGrapesEditor', () => {
  it('does not mount without a container', () => {
    renderHook(() => useGrapesEditor({ current: null }, baseOptions()));
    expect(grapes.init).not.toHaveBeenCalled();
  });

  it('opens the starting HTML and CSS with the article defaults', () => {
    const { result } = mount();
    const [{ config, addClass, addButton }] = editors;
    expect(config).toMatchObject({
      height: '100%',
      storageManager: false,
      components: '<p>Start</p>',
      style: 'p{margin:0}',
      canvas: { styles: ['https://exyconn.com/site.css'] },
      deviceManager: { devices: DEVICES },
      blockManager: { blocks: ARTICLE_BLOCKS },
      plugins: [],
      selectorManager: { componentFirst: true },
      assetManager: { assets: [], embedAsBase64: false },
    });
    expect(config).not.toHaveProperty('projectData');
    expect(addClass).toHaveBeenCalledWith('article-body');
    expect(addButton).toHaveBeenCalledTimes(DEVICES.length);
    expect(result.current.current).toBe(editors[0].editor);
  });

  it('opens a saved project instead, with the given blocks, plugins and assets', () => {
    const plugin = vi.fn();
    const blocks = [{ id: 'only', label: 'Only', content: '<p/>' }];
    const projectData = { pages: [{ id: 'p' }] };
    mount({ projectData, blocks, plugins: [plugin], assets: ['https://ik.imagekit.io/x/b.png'] });
    const [{ config }] = editors;
    expect(config.projectData).toBe(projectData);
    expect(config).not.toHaveProperty('components');
    expect(config.blockManager?.blocks).toBe(blocks);
    expect(config.plugins).toEqual([plugin]);
    expect(config.assetManager?.assets).toEqual(['https://ik.imagekit.io/x/b.png']);
  });

  it('reports edits only after the initial body has loaded', () => {
    const onDirty = vi.fn();
    mount({ onDirty });
    const [fake] = editors;
    fake.fire('update');
    expect(onDirty).not.toHaveBeenCalled();
    fake.fire('load');
    fake.fire('update');
    expect(onDirty).toHaveBeenCalledTimes(1);
  });

  it('destroys the editor once on unmount and keeps it across re-renders', () => {
    const { rerender, unmount, result } = mount();
    rerender();
    expect(grapes.init).toHaveBeenCalledTimes(1);
    unmount();
    expect(editors[0].destroy).toHaveBeenCalledTimes(1);
    expect(result.current.current).toBeNull();
  });
});

describe('canvas CSS', () => {
  it('writes the CSS into the canvas document once it loads', () => {
    mount({ canvasCss: ':root{--x:1}' });
    editors[0].fire('load');
    const style = document.head.querySelector<HTMLStyleElement>('style[data-live-editor="canvas"]');
    expect(style?.textContent).toBe(':root{--x:1}');
  });

  it('skips the CSS when the canvas has no document', () => {
    mount({ canvasCss: ':root{--x:1}' });
    editors[0].getDocument.mockReturnValue(undefined);
    editors[0].fire('load');
    expect(document.head.querySelector('style[data-live-editor]')).toBeNull();
  });

  it('subscribes nothing extra without canvas CSS', () => {
    mount();
    editors[0].fire('load');
    expect(editors[0].getDocument).not.toHaveBeenCalled();
    expect(document.head.querySelector('style[data-live-editor]')).toBeNull();
  });
});

describe('readDesign', () => {
  it('reads an empty design when the editor has no wrapper or CSS', () => {
    const editor = { getWrapper: () => undefined, getCss: () => undefined } as unknown as Editor;
    expect(readDesign(editor)).toEqual({ html: '', css: '' });
  });
});
