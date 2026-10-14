import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, isValid, parseISO } from "date-fns";
import { useController } from "react-hook-form";
import type { Estimate } from "@exyconn/gcc-cost";
import { errorText } from "./FieldLabel";
import type { EstimatePath } from "./inputs";

/** Stored as an ISO calendar date (yyyy-MM-dd) or "" when not set; shown by the picker. */
const ISO_DATE = "yyyy-MM-dd";

export function DateInput({
  name,
  label,
  hint,
}: Readonly<{ name: EstimatePath; label: string; hint?: string }>) {
  const { field, fieldState } = useController<Estimate>({ name });
  const stored = typeof field.value === "string" && field.value ? parseISO(field.value) : null;
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label={label}
        value={stored}
        onChange={(date) => field.onChange(date && isValid(date) ? format(date, ISO_DATE) : "")}
        slotProps={{
          field: { clearable: true },
          textField: {
            size: "small",
            fullWidth: true,
            onBlur: field.onBlur,
            error: Boolean(fieldState.error),
            helperText: errorText(fieldState.error, hint),
          },
        }}
      />
    </LocalizationProvider>
  );
}
