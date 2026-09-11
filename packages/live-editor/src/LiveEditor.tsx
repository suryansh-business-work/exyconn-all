import { useImperativeHandle, useRef } from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { Box, color } from '@exyconn/ui';
import { readDesign, useGrapesEditor } from './useGrapesEditor';
import type { LiveEditorProps } from './types';

/** GrapesJS paints its panels from four CSS variables; these put them on the brand palette. */
const PANEL_THEME = {
  '--gjs-primary-color': color.neutral[800],
  '--gjs-secondary-color': color.neutral[100],
  '--gjs-tertiary-color': color.blue[600],
  '--gjs-quaternary-color': color.azure[300],
  '--gjs-font-size': '0.8rem',
};

/**
 * Visual editor for an article body: GrapesJS with article blocks, the style manager,
 * device previews and ImageKit uploads, on a canvas that loads the live site's
 * stylesheets. Fills its parent — give it a sized container.
 */
export function LiveEditor({
  initial,
  canvasStyles,
  canvasClass,
  uploadImage,
  onError,
  onDirty,
  ref,
}: Readonly<LiveEditorProps>) {
  const container = useRef<HTMLDivElement>(null);
  const editor = useGrapesEditor(container, {
    initial,
    canvasStyles,
    canvasClass,
    uploadImage,
    onError,
    onDirty,
  });

  useImperativeHandle(
    ref,
    () => ({
      getDesign: () => {
        if (!editor.current) {
          throw new Error('The live editor is not ready yet');
        }
        return readDesign(editor.current);
      },
    }),
    [editor],
  );

  return <Box ref={container} sx={{ height: '100%', ...PANEL_THEME }} />;
}
