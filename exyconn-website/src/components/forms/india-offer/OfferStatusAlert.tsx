import type { SubmitStatus } from "../shared";

const BANNER = "mb-6 flex items-center gap-2 rounded-xl border p-4";

/** The Hindi banner above the offer form after a send. */
export function OfferStatusAlert({ status }: Readonly<{ status: SubmitStatus }>) {
  if (status === "success") {
    return (
      <div
        role="status"
        className={`${BANNER} border-green-muted bg-green-subtle text-green-fg-strong`}
      >
        <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
        <span>धन्यवाद! हम जल्द ही आपसे संपर्क करेंगे।</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div role="alert" className={`${BANNER} border-red-muted bg-red-subtle text-red-fg-strong`}>
        <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
        <span>कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।</span>
      </div>
    );
  }
  return null;
}
