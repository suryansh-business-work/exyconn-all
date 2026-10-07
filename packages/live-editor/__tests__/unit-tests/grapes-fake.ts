import type { Editor, EditorConfig } from 'grapesjs';
import { vi } from 'vitest';

/** A stand-in for the GrapesJS editor the React hook drives: it records what was asked of it. */
export interface FakeEditor {
  config: EditorConfig;
  handlers: Map<string, Array<() => void>>;
  addClass: ReturnType<typeof vi.fn>;
  addButton: ReturnType<typeof vi.fn>;
  addAsset: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  getDocument: ReturnType<typeof vi.fn>;
  /** Runs every handler subscribed to `event`. */
  fire: (event: string) => void;
  editor: Editor;
}

export const fakeEditor = (config: EditorConfig): FakeEditor => {
  const handlers = new Map<string, Array<() => void>>();
  const addClass = vi.fn();
  const addButton = vi.fn();
  const addAsset = vi.fn();
  const destroy = vi.fn();
  const getDocument = vi.fn(() => document);
  const editor = {
    getWrapper: () => ({ addClass, getInnerHTML: () => '<p>Body</p>' }),
    getCss: () => '#a{color:red;}',
    getProjectData: () => ({ pages: [] }),
    on: (event: string, handler: () => void) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    },
    destroy,
    setDevice: vi.fn(),
    Canvas: { getDocument },
    Panels: { addButton },
    AssetManager: { add: addAsset },
  } as unknown as Editor;
  const fire = (event: string) => {
    for (const handler of handlers.get(event) ?? []) {
      handler();
    }
  };
  return { config, handlers, addClass, addButton, addAsset, destroy, getDocument, fire, editor };
};

/** The drop event GrapesJS hands its `uploadFile` hook. */
export const dropOf = (...files: File[]) => ({ dataTransfer: { files } }) as unknown as DragEvent;

export const imageFile = (name: string) => new File(['x'], name, { type: 'image/png' });
