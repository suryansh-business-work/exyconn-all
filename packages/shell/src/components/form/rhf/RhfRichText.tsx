import { useController, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { RichTextEditor } from '@exyconn/rich-text';
import { useImageKitUpload } from '@/hooks/useImageKitUpload';
import { useFieldMeta } from './useFieldMeta';

interface RhfRichTextProps {
  name: string;
  label: string;
  required?: boolean;
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
  required,
  helperText,
  placeholder,
  folder = 'rich-text',
  minHeight,
}: Readonly<RhfRichTextProps>) {
  const { control } = useFormContext();
  // This editor takes plain strings, so it translates them directly rather than as nodes.
  const t = useT();
  const { field, fieldState } = useController({ name, control });
  const meta = useFieldMeta(name, { required, helperText });
  const uploadImage = useImageKitUpload(folder);

  return (
    <RichTextEditor
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      uploadImage={uploadImage}
      label={t(label)}
      required={meta.required}
      helperText={meta.helperText ? t(meta.helperText) : undefined}
      error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
      placeholder={placeholder}
      minHeight={minHeight}
    />
  );
}
