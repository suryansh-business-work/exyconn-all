/**
 * Uploads one image and resolves to its public URL. The editor calls it for the image
 * dialog's file picker and for images pasted or dropped into the document; the host
 * decides where the bytes go (the portal sends them to ImageKit).
 */
export type UploadImage = (file: File) => Promise<string>;

export interface RichTextEditorProps {
  /** The document as HTML. An empty document is `''`. */
  value: string;
  /** Receives the new HTML on every edit — `''` once the document is empty. */
  onChange: (html: string) => void;
  onBlur?: () => void;
  uploadImage: UploadImage;
  label: string;
  helperText?: string;
  /** Validation message; also switches the frame to the error colour. */
  error?: string;
  placeholder?: string;
  /** Minimum height of the writing area, in pixels. */
  minHeight?: number;
}
