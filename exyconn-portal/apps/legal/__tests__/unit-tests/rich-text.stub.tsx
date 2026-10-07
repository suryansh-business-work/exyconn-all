import { useController, useFormContext } from 'react-hook-form';

interface RichTextStubProps {
  name: string;
  label: string;
  helperText?: string;
  folder?: string;
  minHeight?: number;
}

/**
 * Stands in for the shell's `RhfRichText` (TipTap is tested in @exyconn/rich-text): a textarea
 * bound to the same form field, showing the hint and the validation message it would.
 */
export function RhfRichTextStub({
  name,
  label,
  helperText,
  folder,
  minHeight,
}: Readonly<RichTextStubProps>) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  return (
    <div data-testid="rich-text" data-folder={folder} data-min-height={minHeight}>
      <textarea
        aria-label={label}
        value={field.value ?? ''}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
      />
      {helperText && <p>{helperText}</p>}
      {fieldState.error?.message && <p role="alert">{fieldState.error.message}</p>}
    </div>
  );
}

/** Stands in for the shell's `RichTextDownload`: shows the title and HTML it was handed. */
export function RichTextDownloadStub({ title, html }: Readonly<{ title: string; html: string }>) {
  return (
    <output data-testid="download" data-title={title}>
      {html}
    </output>
  );
}
