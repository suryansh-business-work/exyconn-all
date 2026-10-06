import { SvgIcon } from "./SvgIcon";
import { SUBMIT_COPY } from "./copy";
import type { SubmitStatus } from "./useCaptchaSubmit";

interface SubmitStatusAlertProps {
  status: SubmitStatus;
  successMessage: string;
  /** The failure notice; the English one unless the form's copy says otherwise. */
  errorMessage?: string;
}

/** The banner above a form after a send: its own thank-you, or the shared failure notice. */
export function SubmitStatusAlert({
  status,
  successMessage,
  errorMessage = SUBMIT_COPY.failed,
}: Readonly<SubmitStatusAlertProps>) {
  if (status === "success") {
    return (
      <div
        role="status"
        className="mb-6 p-4 bg-green-subtle border border-green-muted rounded-xl text-green-fg-strong flex items-center gap-2"
      >
        <SvgIcon name="check-circle" />
        <span>{successMessage}</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div
        role="alert"
        className="mb-6 p-4 bg-red-subtle border border-red-muted rounded-xl text-red-fg-strong flex items-center gap-2"
      >
        <SvgIcon name="alert-circle" />
        <span>{errorMessage}</span>
      </div>
    );
  }
  return null;
}
