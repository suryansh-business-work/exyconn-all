import InfoOutlined from "@mui/icons-material/InfoOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { FieldError } from "react-hook-form";

/** A label with an optional "what is this?" tooltip for technical financial parameters. */
export function FieldLabel({ label, tip }: Readonly<{ label: string; tip?: string }>) {
  if (!tip) {
    return <>{label}</>;
  }
  return (
    <span className="gcc-label">
      {label}
      <Tooltip title={tip} arrow>
        <IconButton size="small" aria-label={`About ${label}`} className="gcc-label__tip">
          <InfoOutlined fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </span>
  );
}

const NUMBER_TYPES = new Set(["invalid_type", "invalid_union"]);

/** A validation message a person can act on. Zod's type errors become "Enter a number". */
export function errorText(error: FieldError | undefined, hint?: string): string | undefined {
  if (!error) {
    return hint;
  }
  if (error.type && NUMBER_TYPES.has(error.type)) {
    return "Enter a valid value";
  }
  return error.message || "Check this value";
}
