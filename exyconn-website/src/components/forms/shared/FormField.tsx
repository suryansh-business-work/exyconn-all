import type { ReactNode } from "react";
import { ERROR_CLASSES, LABEL_CLASSES } from "./fieldClasses";

type Marker = "required" | "optional";

const markerOf = (marker: Marker, optionalLabel: string): ReactNode =>
  marker === "required" ? (
    <span className="text-red-fg">*</span>
  ) : (
    <span className="text-fg-faint font-normal">{optionalLabel}</span>
  );

interface FormFieldProps {
  /** The id of the control inside, so the label points at it. */
  id: string;
  label: string;
  marker?: Marker;
  error?: string;
  /** The words beside an optional field's label. */
  optionalLabel?: string;
  children: ReactNode;
}

/** A label, the control passed in as children, and the control's error once it has one. */
export function FormField({
  id,
  label,
  marker,
  error,
  optionalLabel = "(optional)",
  children,
}: Readonly<FormFieldProps>) {
  return (
    <div>
      <label className={LABEL_CLASSES} htmlFor={id}>
        {label}
        {marker && <> {markerOf(marker, optionalLabel)}</>}
      </label>
      {children}
      {error && <div className={ERROR_CLASSES}>{error}</div>}
    </div>
  );
}
