/**
 * The words every website form shares. A form on a CMS page receives them as props (the
 * catalogue's 'forms.*' / page components); the English below is what the forms that are not
 * in the CMS yet (careers, the WhatsApp demo) still show.
 */
export interface CaptchaCopy {
  label: string;
  placeholder: string;
  hint: string;
  refreshTitle: string;
  refreshLabel: string;
}

/** What the send step says: while the question loads, when it fails, when the answer is wrong. */
export interface SubmitCopy {
  loading: string;
  loadFailed: string;
  incorrect: string;
  /** The banner when a send fails. */
  failed: string;
}

export const CAPTCHA_COPY: CaptchaCopy = {
  label: "Security Check",
  placeholder: "Answer",
  hint: "Type the answer to the sum. It stops automated spam.",
  refreshTitle: "New question",
  refreshLabel: "Show a new security question",
};

export const SUBMIT_COPY: SubmitCopy = {
  loading: "Loading…",
  loadFailed: "The security question could not be loaded. Please refresh it.",
  incorrect: "That answer was not right. Please try the new question.",
  failed: "Something went wrong. Please try again.",
};

/** A field's label and placeholder. */
export interface FieldCopy {
  label: string;
  placeholder: string;
}

/** One choice of a select: the value sent (a contract with the portal) and its label. */
export interface OptionCopy {
  value: string;
  label: string;
}

/** A sentence that ends in a link, e.g. "By submitting this form, you agree to our Privacy Policy." */
export interface FinePrintCopy {
  text: string;
  linkLabel: string;
  linkHref: string;
  after: string;
}
