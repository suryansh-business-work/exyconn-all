import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { useEffect, useState, type ReactNode } from "react";
import { useController, type FieldPath } from "react-hook-form";
import type { Estimate } from "@exyconn/gcc-cost";
import { errorText, FieldLabel } from "./FieldLabel";

export type EstimatePath = FieldPath<Estimate>;

interface BaseProps {
  name: EstimatePath;
  label: string;
  tip?: string;
  hint?: string;
  disabled?: boolean;
}

export function TextInput({
  name,
  label,
  tip,
  hint,
  disabled,
  multiline,
  required,
}: Readonly<BaseProps & { multiline?: boolean; required?: boolean }>) {
  const { field, fieldState } = useController<Estimate>({ name });
  return (
    <TextField
      {...field}
      value={field.value ?? ""}
      label={<FieldLabel label={label} tip={tip} />}
      required={required}
      disabled={disabled}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      error={Boolean(fieldState.error)}
      helperText={errorText(fieldState.error, hint)}
    />
  );
}

const toText = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "";

/**
 * A number typed as text, so "1." or an empty box can exist while typing. An empty box is
 * `null` when the field is nullable (an optional assumption), otherwise NaN, which the schema
 * reports beside the field.
 */
export function NumberInput({
  name,
  label,
  tip,
  hint,
  disabled,
  unit,
  prefix,
  nullable,
}: Readonly<BaseProps & { unit?: ReactNode; prefix?: ReactNode; nullable?: boolean }>) {
  const { field, fieldState } = useController<Estimate>({ name });
  const [text, setText] = useState(toText(field.value));
  useEffect(() => {
    if (Number(text) !== field.value) {
      setText(toText(field.value));
    }
    // Only an outside change (reset, import, scenario switch) replaces what is being typed.
  }, [field.value]);
  const emptyValue = nullable ? null : Number.NaN;
  return (
    <TextField
      name={field.name}
      inputRef={field.ref}
      onBlur={field.onBlur}
      value={text}
      onChange={(event) => {
        const next = event.target.value.replaceAll(",", "");
        setText(next);
        field.onChange(next.trim() === "" ? emptyValue : Number(next));
      }}
      label={<FieldLabel label={label} tip={tip} />}
      disabled={disabled}
      error={Boolean(fieldState.error)}
      helperText={errorText(fieldState.error, hint)}
      slotProps={{
        htmlInput: { inputMode: "decimal" },
        input: {
          startAdornment: prefix ? (
            <InputAdornment position="start">{prefix}</InputAdornment>
          ) : undefined,
          endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined,
        },
      }}
    />
  );
}

export interface Option {
  value: string | number;
  label: string;
}

export function SelectInput({
  name,
  label,
  tip,
  hint,
  disabled,
  options,
}: Readonly<BaseProps & { options: readonly Option[] }>) {
  const { field, fieldState } = useController<Estimate>({ name });
  return (
    <TextField
      {...field}
      value={field.value ?? ""}
      select
      label={<FieldLabel label={label} tip={tip} />}
      disabled={disabled}
      error={Boolean(fieldState.error)}
      helperText={errorText(fieldState.error, hint)}
      onChange={(event) => {
        const option = options.find((item) => String(item.value) === event.target.value);
        field.onChange(option?.value ?? event.target.value);
      }}
    >
      {options.map((option) => (
        <MenuItem key={String(option.value)} value={String(option.value)}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function SwitchInput({ name, label, disabled }: Readonly<Omit<BaseProps, "tip" | "hint">>) {
  const { field } = useController<Estimate>({ name });
  return (
    <FormControlLabel
      control={
        <Switch
          checked={Boolean(field.value)}
          onChange={(event) => field.onChange(event.target.checked)}
          onBlur={field.onBlur}
          slotProps={{ input: { ref: field.ref } }}
          disabled={disabled}
        />
      }
      label={label}
    />
  );
}
