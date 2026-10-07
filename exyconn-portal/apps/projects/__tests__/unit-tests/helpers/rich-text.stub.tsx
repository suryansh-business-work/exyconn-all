import { useController, useFormContext } from 'react-hook-form';

interface RichTextStubProps {
  name: string;
  label: string;
}

/**
 * Stands in for the shell's `RhfRichText` (TipTap is tested in @exyconn/rich-text): a textarea
 * bound to the same form field.
 */
export function RhfRichTextStub({ name, label }: Readonly<RichTextStubProps>) {
  const { control } = useFormContext();
  const { field } = useController({ name, control });
  return (
    <textarea
      aria-label={label}
      value={field.value ?? ''}
      onChange={(event) => field.onChange(event.target.value)}
      onBlur={field.onBlur}
    />
  );
}
