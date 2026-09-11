import type { SubmitStatus } from "./useCaptchaSubmit";

interface SubmitStatusAlertProps {
  status: SubmitStatus;
  successMessage: string;
}

/** The banner above a form after a send: its own thank-you, or the shared failure notice. */
export function SubmitStatusAlert({ status, successMessage }: Readonly<SubmitStatusAlertProps>) {
  if (status === "success") {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
        <i className="fa-solid fa-check-circle"></i>
        <span>{successMessage}</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
        <i className="fa-solid fa-exclamation-circle"></i>
        <span>Something went wrong. Please try again.</span>
      </div>
    );
  }
  return null;
}
