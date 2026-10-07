import { useImperativeHandle } from 'react';
import { vi } from 'vitest';
import type { CmsPluginOptions, LiveEditorProps } from '@exyconn/live-editor';

/** What the stand-ins saw, and the doubles the builder screen is handed. */
export const harness = {
  editor: null as LiveEditorProps | null,
  plugin: null as CmsPluginOptions | null,
  upload: vi.fn(),
  confirm: vi.fn(),
};

/** The HTML the stand-in canvas reports as its design. */
export const CANVAS_HTML = '<p>Draft</p>';

/**
 * Stands in for GrapesJS (it needs a real browser canvas): records its props, answers the
 * editor handle, and exposes an edit and an upload failure as buttons.
 */
function LiveEditorStub(props: Readonly<LiveEditorProps>) {
  harness.editor = props;
  useImperativeHandle(props.ref, () => ({
    getDesign: () => ({ html: CANVAS_HTML, css: '' }),
    getProjectData: () => ({}),
  }));
  return (
    <div>
      <p>Canvas</p>
      <button type="button" onClick={props.onDirty}>
        Edit canvas
      </button>
      <button type="button" onClick={() => props.onError('Upload failed')}>
        Fail upload
      </button>
    </div>
  );
}

/** `@exyconn/live-editor` with the canvas stubbed and the CMS blocks and plugin recorded. */
export function liveEditorModule() {
  return {
    LiveEditor: LiveEditorStub,
    cmsBlocks: (components: readonly unknown[], fragments: readonly unknown[]) => [
      `${components.length} components`,
      `${fragments.length} fragments`,
    ],
    cmsEditorPlugin: (options: CmsPluginOptions) => {
      harness.plugin = options;
      return 'cms-plugin';
    },
  };
}

/** The resources a builder opens with. */
export const RESOURCES = {
  components: [],
  fragments: [{ id: 'fragment-1', name: 'Header', kind: 'HEADER' }],
  canvasCss: ':root {}',
  canvasStyles: ['https://fonts/site.css'],
  assets: ['https://cdn/a.png'],
};

/** Makes every media query match, as on a phone. */
export function matchEveryMediaQuery() {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: true,
    media,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}
