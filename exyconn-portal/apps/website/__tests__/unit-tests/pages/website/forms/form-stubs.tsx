import { Controller, useFormContext } from 'react-hook-form';

/** The props the rich-text, date-picker and media fields share. */
interface BoundFieldStubProps {
  name: string;
  label: string;
  siteId?: string;
  helperText?: string;
}

/**
 * Stands in for the fields jsdom cannot drive — the TipTap rich-text editor (and its ImageKit
 * upload), MUI X's sectioned date picker and the media library picker. It is a plain text box
 * bound to the same form field, named by the field's label, which shows the field's error and
 * the site it was handed (`data-site`), so a test can type a value and read what was saved.
 */
export function BoundFieldStub({ name, label, siteId }: Readonly<BoundFieldStubProps>) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <textarea
            aria-label={label}
            data-site={siteId ?? ''}
            name={field.name}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(event) => field.onChange(event.target.value)}
            onBlur={field.onBlur}
          />
          {fieldState.error && <p role="alert">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}
