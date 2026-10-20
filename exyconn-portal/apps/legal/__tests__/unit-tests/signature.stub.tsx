import { useController, useFormContext } from 'react-hook-form';

/** What the stub pad hands the form when "Draw a signature" is pressed. */
export const DRAWN_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

interface SignaturePadStubProps {
  name: string;
  label: string;
  helperText?: string;
  required?: boolean;
}

/**
 * Stands in for the shell's `RhfSignaturePad` (the canvas pad is tested in @exyconn/shell): a
 * button that "draws" a fixed PNG into the same form field, showing the hint and the
 * validation message it would.
 */
export function RhfSignaturePadStub({
  name,
  label,
  helperText,
  required,
}: Readonly<SignaturePadStubProps>) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  return (
    <div data-testid="signature-pad" data-required={String(Boolean(required))}>
      <p>{label}</p>
      <button type="button" onClick={() => field.onChange(DRAWN_SIGNATURE)}>
        Draw a signature
      </button>
      <p>{fieldState.error?.message ?? helperText}</p>
    </div>
  );
}
