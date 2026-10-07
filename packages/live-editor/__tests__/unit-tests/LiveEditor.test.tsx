import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import type { EditorConfig } from 'grapesjs';
import { LiveEditor, type LiveEditorHandle, type LiveEditorProps } from '../../src';
import { dropOf, fakeEditor, imageFile, type FakeEditor } from './grapes-fake';

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
});

const props = (overrides: Partial<LiveEditorProps> = {}): LiveEditorProps => ({
  initial: { html: '<p>Start</p>', css: '' },
  canvasStyles: [],
  canvasClass: 'article-body',
  uploadImage: vi.fn(async (file: File) => `https://ik.imagekit.io/x/${file.name}`),
  onError: vi.fn(),
  onDirty: vi.fn(),
  ...overrides,
});

const uploadFile = (fake: FakeEditor) => {
  const hook = fake.config.assetManager?.uploadFile;
  if (typeof hook !== 'function') {
    throw new Error('The editor has no upload hook');
  }
  return hook;
};

describe('LiveEditor', () => {
  it('mounts GrapesJS into a full-height box themed with the brand palette', () => {
    const { container } = render(<LiveEditor {...props()} />);
    const box = container.firstElementChild;
    expect(editors[0].config.container).toBe(box);
    expect(box).toHaveStyle({ height: '100%' });
    expect(getComputedStyle(box as Element).getPropertyValue('--gjs-font-size')).toBe('0.8rem');
  });

  it('reads the design and the project through its ref', () => {
    const ref = createRef<LiveEditorHandle>();
    render(<LiveEditor {...props()} ref={ref} />);
    expect(ref.current?.getDesign()).toEqual({ html: '<p>Body</p>', css: '#a{color:red;}' });
    expect(ref.current?.getProjectData()).toEqual({ pages: [] });
  });

  it('refuses to read once the editor is torn down', () => {
    const ref = createRef<LiveEditorHandle>();
    const { unmount } = render(<LiveEditor {...props()} ref={ref} />);
    const handle = ref.current;
    unmount();
    expect(editors[0].destroy).toHaveBeenCalledTimes(1);
    expect(() => handle?.getDesign()).toThrow('The live editor is not ready yet');
    expect(() => handle?.getProjectData()).toThrow('The live editor is not ready yet');
  });

  it('uses the latest callbacks without re-creating the editor', () => {
    const first = props();
    const { rerender } = render(<LiveEditor {...first} />);
    const second = props();
    rerender(<LiveEditor {...second} />);
    const [fake] = editors;
    fake.fire('load');
    fake.fire('update');
    expect(grapes.init).toHaveBeenCalledTimes(1);
    expect(first.onDirty).not.toHaveBeenCalled();
    expect(second.onDirty).toHaveBeenCalledTimes(1);
  });

  it('uploads dropped images through the host and adds them to the asset manager', async () => {
    const options = props();
    render(<LiveEditor {...options} />);
    const [fake] = editors;
    await uploadFile(fake)(dropOf(imageFile('a.png')));
    expect(options.uploadImage).toHaveBeenCalledTimes(1);
    expect(fake.addAsset).toHaveBeenCalledWith(['https://ik.imagekit.io/x/a.png']);
  });

  it('reports a failed upload through the latest onError', async () => {
    const onError = vi.fn();
    const failing = vi.fn(async () => {
      throw new Error('Upload rejected by ImageKit');
    });
    const { rerender } = render(<LiveEditor {...props()} />);
    rerender(<LiveEditor {...props({ uploadImage: failing, onError })} />);
    const [fake] = editors;
    await uploadFile(fake)(dropOf(imageFile('a.png')));
    expect(onError).toHaveBeenCalledWith('Upload rejected by ImageKit');
    expect(fake.addAsset).not.toHaveBeenCalled();
  });
});
