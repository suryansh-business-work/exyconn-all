import { useController, useFormContext } from 'react-hook-form';
import { SignaturePad, type SignaturePadProps } from './SignaturePad';

type RhfSignaturePadProps = { name: string } & Omit<SignaturePadProps, 'onChange' | 'error'>;

/** The signature pad as a form field: its value is the PNG data URL, '' while unsigned. */
export function RhfSignaturePad({ name, ...props }: Readonly<RhfSignaturePadProps>) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  return (
    <SignaturePad
      {...props}
      onChange={(value) => {
        field.onChange(value);
        field.onBlur();
      }}
      error={fieldState.error?.message}
    />
  );
}
