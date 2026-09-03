/**
 * Compatibility shim: the design system now lives in `@exyconn/ui`. Existing
 * `@/components/ui` / `@exyconn/shell/components/ui` imports keep working through
 * this re-export until they are codemodded to `@exyconn/ui` directly.
 */
export * from '@exyconn/ui';

// The platform's single upload dialog — device file, Pexels photo or Pexels clip —
// used by every image field (moves to `@exyconn/uploader` next; it depends on the
// shell's Apollo client, so it cannot live in the design system).
export { ImageUploadDialog, ImagePreview, type UploadMediaKind } from './ImageUploadDialog';
