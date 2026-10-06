import type { UseFormRegisterReturn } from "react-hook-form";
import { type CaptchaCopy, FormField, inputClassName } from "../shared";

interface OfferCaptchaProps {
  question: string;
  registration: UseFormRegisterReturn;
  /** The schema's error for the answer, e.g. when it was left blank. */
  error?: string;
  /** Set when the answer was wrong on submit. */
  captchaError: string;
  onRefresh: () => void;
  copy: Omit<CaptchaCopy, "hint">;
}

/** The offer form's security check in Hindi: the maths question, the answer and a refresh. */
export function OfferCaptcha({
  question,
  registration,
  error,
  captchaError,
  onRefresh,
  copy,
}: Readonly<OfferCaptchaProps>) {
  const invalid = Boolean(error) || Boolean(captchaError);
  return (
    <FormField id="offer-captcha" label={copy.label} marker="required" error={error}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Announced when a new question replaces the old one. */}
        <span
          id="offer-captcha-question"
          aria-live="polite"
          className="rounded-lg border border-line bg-surface px-4 py-3 font-mono font-bold text-fg"
        >
          {question}
        </span>
        <div className="w-28">
          <input
            type="text"
            id="offer-captcha"
            inputMode="numeric"
            placeholder={copy.placeholder}
            autoComplete="off"
            aria-describedby="offer-captcha-question"
            aria-invalid={invalid}
            className={inputClassName("blue", invalid)}
            {...registration}
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-fg-secondary transition-colors hover:text-fg"
          title={copy.refreshTitle}
          aria-label={copy.refreshLabel}
        >
          <i className="fa-solid fa-rotate-right" aria-hidden="true"></i>
        </button>
      </div>
      {captchaError && (
        <div role="alert" className="mt-1 text-xs text-red-fg">
          {captchaError}
        </div>
      )}
    </FormField>
  );
}
