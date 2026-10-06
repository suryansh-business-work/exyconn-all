import type { Ref } from 'react';
import type { BlockProperties, Editor, ProjectData } from 'grapesjs';

/** An article body as the live editor produces it: the markup, and the CSS its styles need. */
export interface LiveDesign {
  html: string;
  css: string;
}

/** Read the current design — the host calls it when the user saves. */
export interface LiveEditorHandle {
  getDesign: () => LiveDesign;
  /** GrapesJS's whole project (components, styles, assets), to reopen it exactly as it was. */
  getProjectData: () => ProjectData;
}

/** Extends the editor at mount: registers component types, commands, panel buttons. */
export type LiveEditorPlugin = (editor: Editor) => void;

/** Uploads one image and resolves to its public URL (the portal sends it to ImageKit). */
export type UploadImage = (file: File) => Promise<string>;

export interface LiveEditorProps {
  /** The body to start from. Read once, on mount — key the editor by the record it edits. */
  initial: LiveDesign;
  /** Stylesheets loaded into the canvas, so it renders the way the live page does. */
  canvasStyles: readonly string[];
  /** Class put on the canvas body — the class the live page wraps the article in. */
  canvasClass: string;
  uploadImage: UploadImage;
  /** Reports a failure the user should see (an upload that did not go through). */
  onError: (message: string) => void;
  /** Called whenever the design changes, so the host can track unsaved work. */
  onDirty: () => void;
  /** A saved GrapesJS project; when given it is opened instead of `initial`. */
  projectData?: ProjectData | null;
  /** The blocks panel. Defaults to the article blocks. */
  blocks?: BlockProperties[];
  /** CSS written into the canvas only (design tokens, placeholders); never saved. */
  canvasCss?: string;
  /** Image URLs the asset manager offers before anything is uploaded (a media library). */
  assets?: readonly string[];
  plugins?: readonly LiveEditorPlugin[];
  ref?: Ref<LiveEditorHandle>;
}
