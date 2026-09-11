import type { ReactNode } from "react";
import { ERROR_CLASSES, LABEL_CLASSES } from "./fieldClasses";

type Marker = "required" | "optional";

const MARKERS: Record<Marker, ReactNode> = {
  required: <span className="text-red-500">*</span>,
  optional: <span className="text-gray-400 font-normal">(optional)</span>,
};

interface FormFieldProps {
  /** The id of the control inside, so the label points at it. */
  id: string;
  label: string;
  marker?: Marker;
  error?: string;
  children: ReactNode;
}

/** A label, the control passed in as children, and the control's error once it has one. */
export function FormField({ id, label, marker, error, children }: Readonly<FormFieldProps>) {
  return (
    <div>
      <label className={LABEL_CLASSES} htmlFor={id}>
        {label}
        {marker && <> {MARKERS[marker]}</>}
      </label>
      {children}
      {error && <div className={ERROR_CLASSES}>{error}</div>}
    </div>
  );
}
