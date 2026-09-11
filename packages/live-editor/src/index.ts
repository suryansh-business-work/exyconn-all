/**
 * `@exyconn/live-editor` — GrapesJS for the website's article bodies.
 *
 * Drag-and-drop article blocks, a style manager, desktop / tablet / mobile previews
 * and ImageKit uploads, on a canvas that loads the live site's stylesheets so the body
 * looks exactly as it will on the page. It produces the body HTML plus the CSS its
 * styles need; the website scopes that CSS to the article when it renders it.
 */
export { LiveEditor } from './LiveEditor';
export type { LiveDesign, LiveEditorHandle, LiveEditorProps, UploadImage } from './types';
