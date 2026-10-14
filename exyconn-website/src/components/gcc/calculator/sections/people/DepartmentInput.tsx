import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useController } from "react-hook-form";
import type { Estimate } from "@exyconn/gcc-cost";
import { errorText, type EstimatePath } from "../../fields";
import { P } from "../../strings/people";

/** The role's department: one of the suggested departments, or any name typed in. */
export function DepartmentInput({
  name,
  options,
}: Readonly<{ name: EstimatePath; options: readonly string[] }>) {
  const { field, fieldState } = useController<Estimate>({ name });
  const value = typeof field.value === "string" ? field.value : "";
  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value}
      onChange={(_event, next) => field.onChange(next ?? "")}
      onInputChange={(_event, next) => field.onChange(next)}
      renderInput={(params) => (
        <TextField
          {...params}
          name={field.name}
          inputRef={field.ref}
          onBlur={field.onBlur}
          label={P.department}
          required
          error={Boolean(fieldState.error)}
          helperText={errorText(fieldState.error, P.departmentHint)}
          slotProps={{ ...params.slotProps }}
        />
      )}
    />
  );
}
