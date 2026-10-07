import { vi } from 'vitest';

interface EditorStubProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** What the media upload hook was asked for, and the uploader it hands the rich-text editor. */
export const mediaUpload = {
  siteIds: [] as string[],
  uploader: vi.fn(() => Promise.resolve('/media/uploaded.png')),
};

/** Stands in for the rich-text editor: shows what it edits, and writes fixed HTML. */
export function RichTextEditorStub({
  label,
  value,
  onChange,
  uploadImage,
}: Readonly<EditorStubProps & { uploadImage: unknown }>) {
  const uploads = uploadImage === mediaUpload.uploader ? 'with uploads' : 'without uploads';
  return (
    <button type="button" onClick={() => onChange('<p>Rewritten</p>')}>
      {`Rich ${label} ${uploads}: ${value}`}
    </button>
  );
}

/** Stands in for the media picker: shows what it edits, and picks a fixed file. */
export function MediaUrlInputStub({
  label,
  value,
  onChange,
  siteId,
}: Readonly<EditorStubProps & { siteId: string }>) {
  return (
    <button type="button" onClick={() => onChange('/media/picked.png')}>
      {`Media ${label} on ${siteId}: ${value}`}
    </button>
  );
}

/** Stands in for useMediaUpload: records the site and returns the shared uploader. */
export function useMediaUploadStub(siteId: string) {
  mediaUpload.siteIds.push(siteId);
  return mediaUpload.uploader;
}
