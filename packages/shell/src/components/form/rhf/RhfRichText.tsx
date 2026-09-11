import { useController, useFormContext } from 'react-hook-form';
import { RichTextEditor } from '@exyconn/rich-text';
import { useImageKitUpload } from '@/hooks/useImageKitUpload';

interface RhfRichTextProps {
  name: string;
  label: string;
  helperText?: string;
  placeholder?: string;
  /** ImageKit folder the editor's images are uploaded into. */
  folder?: string;
  minHeight?: number;
}

/**
 * React Hook Form-bound rich-text field — the `@exyconn/rich-text` editor with its
 * images uploaded to ImageKit. The form value is an HTML string; an empty document is
 * written back as `''` so a `min(1)` schema rule still catches "no content".
 */
export function RhfRichText({
  name,
  label,
  helperText,
  placeholder,
  folder = 'rich-text',
  minHeight,
}: Readonly<RhfRichTextProps>) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const uploadImage = useImageKitUpload(folder);

  return (
    <RichTextEditor
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      uploadImage={uploadImage}
      label={label}
      helperText={helperText}
      error={fieldState.error?.message}
      placeholder={placeholder}
      minHeight={minHeight}
    />
  );
}
