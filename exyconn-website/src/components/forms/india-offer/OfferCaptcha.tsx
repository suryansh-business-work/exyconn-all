import type { UseFormRegisterReturn } from "react-hook-form";
import { OFFER_ERROR_CLASSES, offerInputClass } from "./india-offer.classes";
import { OfferField } from "./OfferField";

interface OfferCaptchaProps {
  question: string;
  registration: UseFormRegisterReturn;
  /** The schema's error for the answer, e.g. when it was left blank. */
  error?: string;
  /** Set when the answer was wrong on submit. */
  captchaError: string;
  onRefresh: () => void;
}

/** The offer form's security check: the maths question, the answer box and a refresh button. */
export function OfferCaptcha({
  question,
  registration,
  error,
  captchaError,
  onRefresh,
}: Readonly<OfferCaptchaProps>) {
  const invalid = Boolean(error) || Boolean(captchaError);
  return (
    <OfferField
      id="offer-captcha"
      icon="fa-shield-halved"
      label="सुरक्षा जाँच"
      required
      full
      error={error}
    >
      <div className="captcha-row">
        <span className="captcha-question">{question}</span>
        <input
          type="text"
          id="offer-captcha"
          placeholder="जवाब"
          className={`${offerInputClass(invalid)} captcha-input`}
          autoComplete="off"
          {...registration}
        />
        <button
          type="button"
          onClick={onRefresh}
          className="captcha-refresh"
          title="नया सवाल"
          aria-label="कैप्चा रीफ्रेश करें"
        >
          <i className="fa-solid fa-rotate-right"></i>
        </button>
      </div>
      {captchaError && (
        <div className={OFFER_ERROR_CLASSES}>
          <i className="fa-solid fa-triangle-exclamation"></i> {captchaError}
        </div>
      )}
    </OfferField>
  );
}
