import type { Ref } from 'react';

/** An article body as the live editor produces it: the markup, and the CSS its styles need. */
export interface LiveDesign {
  html: string;
  css: string;
}

/** Read the current design — the host calls it when the user saves. */
export interface LiveEditorHandle {
  getDesign: () => LiveDesign;
}

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
  ref?: Ref<LiveEditorHandle>;
}
