import type { SubmitStatus } from "../shared";

/** The banner above the offer form after a send, in the page's own alert styling. */
export function OfferStatusAlert({ status }: Readonly<{ status: SubmitStatus }>) {
  if (status === "success") {
    return (
      <div className="form-alert form-alert-success">
        <i className="fa-solid fa-circle-check"></i>
        <span>धन्यवाद! हम जल्द ही आपसे संपर्क करेंगे।</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="form-alert form-alert-error">
        <i className="fa-solid fa-circle-exclamation"></i>
        <span>कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।</span>
      </div>
    );
  }
  return null;
}
