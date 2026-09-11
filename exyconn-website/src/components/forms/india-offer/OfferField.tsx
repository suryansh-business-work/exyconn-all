import type { ReactNode } from "react";
import { OFFER_ERROR_CLASSES, OFFER_LABEL_CLASSES } from "./india-offer.classes";

interface OfferFieldProps {
  /** The id of the control inside, so the label points at it. */
  id: string;
  /** Font Awesome icon shown before the label, e.g. `fa-user`. */
  icon: string;
  label: string;
  required?: boolean;
  /** Spans both grid columns. */
  full?: boolean;
  error?: string;
  children: ReactNode;
}

/** One cell of the offer form grid: an icon label, the control, then its error. */
export function OfferField({
  id,
  icon,
  label,
  required,
  full,
  error,
  children,
}: Readonly<OfferFieldProps>) {
  return (
    <div className={full ? "form-field form-field-full" : "form-field"}>
      <label className={OFFER_LABEL_CLASSES} htmlFor={id}>
        <i className={`fa-solid ${icon} form-field-icon`}></i> {label}
        {required && (
          <>
            {" "}
            <span className="text-red-500">*</span>
          </>
        )}
      </label>
      {children}
      {error && <div className={OFFER_ERROR_CLASSES}>{error}</div>}
    </div>
  );
}
