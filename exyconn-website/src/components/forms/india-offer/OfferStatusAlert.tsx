import type { SubmitStatus } from "../shared";

const BANNER = "mb-6 flex items-center gap-2 rounded-xl border p-4";

interface OfferStatusAlertProps {
  status: SubmitStatus;
  success: string;
  failed: string;
}

/** The Hindi banner above the offer form after a send. */
export function OfferStatusAlert({ status, success, failed }: Readonly<OfferStatusAlertProps>) {
  if (status === "success") {
    return (
      <output className={`${BANNER} border-green-muted bg-green-subtle text-green-fg-strong`}>
        <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
        <span>{success}</span>
      </output>
    );
  }
  if (status === "error") {
    return (
      <div role="alert" className={`${BANNER} border-red-muted bg-red-subtle text-red-fg-strong`}>
        <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
        <span>{failed}</span>
      </div>
    );
  }
  return null;
}
