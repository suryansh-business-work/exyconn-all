import { useEffect, useRef, type RefObject } from 'react';
import grapesjs, { type Editor } from 'grapesjs';
import { assetUploader } from './asset-upload';
import { ARTICLE_BLOCKS } from './blocks';
import { DEVICES, addDeviceButtons } from './devices';
import type { LiveDesign, LiveEditorProps } from './types';

type Callbacks = Pick<LiveEditorProps, 'uploadImage' | 'onError' | 'onDirty'>;

type MountOptions = Pick<
  LiveEditorProps,
  'projectData' | 'blocks' | 'canvasCss' | 'assets' | 'plugins'
>;

interface GrapesOptions extends Callbacks, MountOptions {
  initial: LiveDesign;
  canvasStyles: readonly string[];
  canvasClass: string;
}

/** Writes CSS into the canvas document only: it styles the preview and is never saved. */
function addCanvasCss(editor: Editor, css: string): void {
  editor.on('load', () => {
    const doc = editor.Canvas.getDocument();
    if (!doc) return;
    const style = doc.createElement('style');
    style.dataset.liveEditor = 'canvas';
    style.textContent = css;
    doc.head.append(style);
  });
}

/** The project to open: a saved one, else the starting HTML and CSS. */
const startingContent = (options: GrapesOptions) =>
  options.projectData
    ? { projectData: options.projectData }
    : { components: options.initial.html, style: options.initial.css };

/** The body as it will be stored: the wrapper's children, and only the rules they use. */
export const readDesign = (editor: Editor): LiveDesign => ({
  html: editor.getWrapper()?.getInnerHTML() ?? '',
  css: editor.getCss({ avoidProtected: true, keepUnusedStyles: false }) ?? '',
});

/**
 * Mounts GrapesJS into `container` once and tears it down on unmount. The initial
 * design and canvas settings are read at mount; callbacks are read through a ref so a
 * re-render never re-creates the editor (and loses the user's work).
 */
export function useGrapesEditor(
  container: RefObject<HTMLDivElement | null>,
  {
    initial,
    canvasStyles,
    canvasClass,
    projectData,
    blocks,
    canvasCss,
    assets,
    plugins,
    ...callbacks
  }: GrapesOptions,
): RefObject<Editor | null> {
  const editorRef = useRef<Editor | null>(null);
  const latest = useRef<Callbacks>(callbacks);
  useEffect(() => {
    latest.current = callbacks;
  });
  const mountOptions = useRef<GrapesOptions>({
    initial,
    canvasStyles,
    canvasClass,
    projectData,
    blocks,
    canvasCss,
    assets,
    plugins,
    ...callbacks,
  });

  useEffect(() => {
    if (!container.current) {
      return undefined;
    }
    const options = mountOptions.current;
    const editor = grapesjs.init({
      container: container.current,
      height: '100%',
      storageManager: false,
      ...startingContent(options),
      canvas: { styles: [...options.canvasStyles] },
      deviceManager: { devices: DEVICES },
      blockManager: { blocks: options.blocks ?? ARTICLE_BLOCKS },
      plugins: [...(options.plugins ?? [])],
      selectorManager: { componentFirst: true },
      assetManager: {
        assets: [...(options.assets ?? [])],
        embedAsBase64: false,
        uploadFile: assetUploader(
          () => editorRef.current,
          (file) => latest.current.uploadImage(file),
          (message) => latest.current.onError(message),
        ),
      },
    });
    editor.getWrapper()?.addClass(options.canvasClass);
    if (options.canvasCss) {
      addCanvasCss(editor, options.canvasCss);
    }
    addDeviceButtons(editor);
    // Subscribed once loaded, so parsing the initial body does not count as an edit.
    editor.on('load', () => editor.on('update', () => latest.current.onDirty()));
    editorRef.current = editor;

    return () => {
      editorRef.current = null;
      editor.destroy();
    };
  }, [container]);

  return editorRef;
}
