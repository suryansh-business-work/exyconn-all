import type { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { FormField } from "../../forms/shared";
import { CONTROL_CLASS } from "../../forms/legal/legal-form.styles";

type Marker = "required" | "optional";

interface FieldProps {
  id: string;
  label: string;
  marker?: Marker;
  error?: string;
  registration: UseFormRegisterReturn;
}

type TextFieldProps = FieldProps &
  Pick<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "autoComplete" | "inputMode" | "placeholder"
  >;

/** A labelled text input wired to React Hook Form, with its error under it. */
export function TextField({
  id,
  label,
  marker,
  error,
  registration,
  type = "text",
  ...input
}: Readonly<TextFieldProps>) {
  return (
    <FormField id={id} label={label} marker={marker} error={error}>
      <input
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        className={CONTROL_CLASS}
        {...input}
        {...registration}
      />
    </FormField>
  );
}

interface SelectFieldProps extends FieldProps {
  placeholder: string;
  options: readonly { value: string; label: string }[];
}

/** A labelled native select (keyboard and screen-reader ready) wired to React Hook Form. */
export function SelectField({
  id,
  label,
  marker,
  error,
  registration,
  placeholder,
  options,
}: Readonly<SelectFieldProps>) {
  return (
    <FormField id={id} label={label} marker={marker} error={error}>
      <select id={id} aria-invalid={Boolean(error)} className={CONTROL_CLASS} {...registration}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
