import type { UseFormRegisterReturn } from "react-hook-form";
import { type Accent, ERROR_CLASSES, LABEL_CLASSES, inputClassName } from "./fieldClasses";
import { SvgIcon } from "./SvgIcon";
import { CAPTCHA_COPY, type CaptchaCopy } from "./copy";

const REFRESH_BASE =
  "inline-flex size-11 items-center justify-center rounded-lg text-fg-subtle transition-colors";

const ACCENT_CLASSES: Record<Accent, { icon: string; refresh: string }> = {
  blue: {
    icon: "text-blue-fg",
    refresh: `${REFRESH_BASE} hover:text-blue-fg`,
  },
  amber: {
    icon: "text-amber-fg",
    refresh: `${REFRESH_BASE} hover:text-amber-fg`,
  },
};

interface CaptchaFieldProps {
  question: string;
  registration: UseFormRegisterReturn;
  /** The schema's error for the answer, e.g. when it was left blank. */
  error?: string;
  /** Set when the answer was wrong on submit. */
  captchaError: string;
  onRefresh: () => void;
  accent: Accent;
  copy?: CaptchaCopy;
}

/** The "Security Check" block: the maths question, the answer box and a new-question button. */
export function CaptchaField({
  question,
  registration,
  error,
  captchaError,
  onRefresh,
  accent,
  copy = CAPTCHA_COPY,
}: Readonly<CaptchaFieldProps>) {
  const invalid = Boolean(error) || Boolean(captchaError);
  return (
    <div className="bg-surface-subtle rounded-xl p-4 border border-line">
      <label className={LABEL_CLASSES} htmlFor="captcha">
        {`${copy.label} `}
        <span className="text-red-fg">*</span>
      </label>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-line">
          <SvgIcon name="shield" className={ACCENT_CLASSES[accent].icon} />
          {/* Announced when a new question replaces the old one. */}
          <span id="captcha-question" aria-live="polite" className="font-mono font-bold text-fg">
            {question}
          </span>
        </div>
        <input
          type="text"
          id="captcha"
          inputMode="numeric"
          autoComplete="off"
          placeholder={copy.placeholder}
          aria-describedby="captcha-question captcha-hint"
          aria-invalid={invalid}
          className={`w-24 ${inputClassName(accent, invalid)}`}
          {...registration}
        />
        <button
          type="button"
          onClick={onRefresh}
          className={ACCENT_CLASSES[accent].refresh}
          title={copy.refreshTitle}
          aria-label={copy.refreshLabel}
        >
          <SvgIcon name="refresh" className="icon-md" />
        </button>
      </div>
      <p id="captcha-hint" className="mt-2 text-xs text-fg-subtle">
        {copy.hint}
      </p>
      {error && (
        <div role="alert" className={ERROR_CLASSES}>
          {error}
        </div>
      )}
      {captchaError && (
        <div role="alert" className={ERROR_CLASSES}>
          {captchaError}
        </div>
      )}
    </div>
  );
}
