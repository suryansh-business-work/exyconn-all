import { useEffect, useRef, type RefObject } from 'react';
import grapesjs, { type Editor } from 'grapesjs';
import { assetUploader } from './asset-upload';
import { ARTICLE_BLOCKS } from './blocks';
import { DEVICES, addDeviceButtons } from './devices';
import type { LiveDesign, LiveEditorProps } from './types';

type Callbacks = Pick<LiveEditorProps, 'uploadImage' | 'onError' | 'onDirty'>;

interface GrapesOptions extends Callbacks {
  initial: LiveDesign;
  canvasStyles: readonly string[];
  canvasClass: string;
}

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
  { initial, canvasStyles, canvasClass, ...callbacks }: GrapesOptions,
): RefObject<Editor | null> {
  const editorRef = useRef<Editor | null>(null);
  const latest = useRef<Callbacks>(callbacks);
  useEffect(() => {
    latest.current = callbacks;
  });
  const mountOptions = useRef({ initial, canvasStyles, canvasClass });

  useEffect(() => {
    if (!container.current) {
      return undefined;
    }
    const options = mountOptions.current;
    const editor = grapesjs.init({
      container: container.current,
      height: '100%',
      storageManager: false,
      components: options.initial.html,
      style: options.initial.css,
      canvas: { styles: [...options.canvasStyles] },
      deviceManager: { devices: DEVICES },
      blockManager: { blocks: ARTICLE_BLOCKS },
      selectorManager: { componentFirst: true },
      assetManager: {
        embedAsBase64: false,
        uploadFile: assetUploader(
          () => editorRef.current,
          (file) => latest.current.uploadImage(file),
          (message) => latest.current.onError(message),
        ),
      },
    });
    editor.getWrapper()?.addClass(options.canvasClass);
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
